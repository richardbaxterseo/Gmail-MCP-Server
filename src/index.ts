#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { gmail_v1, google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface GmailAuth {
  gmail: gmail_v1.Gmail;
  initialized: boolean;
}

class GmailMCPServer {
  private server: Server;
  private auth: GmailAuth = { gmail: null as any, initialized: false };
  private defaultDownloadPath: string;

  constructor() {
    // Default to Windows Downloads directory unless specified
    this.defaultDownloadPath = path.join(os.homedir(), 'Downloads');
    
    this.server = new Server(
      {
        name: 'gmail-mcp-enhanced',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private async initializeGmailAuth(): Promise<void> {
    if (this.auth.initialized) return;

    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!credentialsPath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      }

      const credentialsContent = await readFile(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsContent);

      const oauth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris?.[0] || 'urn:ietf:wg:oauth:2.0:oob'
      );

      // Try to load existing tokens
      const tokenPath = path.join(os.homedir(), '.gmail-mcp', 'tokens.json');
      try {
        const tokenContent = await readFile(tokenPath, 'utf8');
        const tokens = JSON.parse(tokenContent);
        oauth2Client.setCredentials(tokens);
      } catch (error) {
        console.error('No existing tokens found. Please run authentication first.');
        throw new Error('Gmail authentication required. Run: npm run auth:test');
      }

      // Set up auto-refresh
      oauth2Client.on('tokens', async (tokens) => {
        await mkdir(path.dirname(tokenPath), { recursive: true });
        await writeFile(tokenPath, JSON.stringify(tokens, null, 2));
      });

      this.auth.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      this.auth.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Gmail auth:', error);
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_gmail_messages',
          description: 'Search Gmail messages with advanced query support and optional pagination',
          inputSchema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
                description: 'Gmail search query (e.g., "from:example@gmail.com subject:invoice has:attachment")',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return (1-500, default: 100)',
                default: 100,
              },
              pageToken: {
                type: 'string',
                description: 'Page token for pagination',
              },
            },
            required: ['q'],
          },
        },
        {
          name: 'read_gmail_message',
          description: 'Read a specific Gmail message by ID with full content and attachment information',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'The Gmail message ID to retrieve',
              },
              format: {
                type: 'string',
                enum: ['full', 'minimal', 'raw'],
                default: 'full',
                description: 'Message format - full includes attachments, minimal for basic info',
              },
            },
            required: ['messageId'],
          },
        },
        {
          name: 'read_gmail_thread',
          description: 'Read a complete Gmail thread with all messages',
          inputSchema: {
            type: 'object',
            properties: {
              threadId: {
                type: 'string',
                description: 'The Gmail thread ID to retrieve',
              },
              includeFullMessages: {
                type: 'boolean',
                default: true,
                description: 'Include full message content for all messages in thread',
              },
            },
            required: ['threadId'],
          },
        },
        {
          name: 'download_gmail_attachment',
          description: 'Download an attachment from a Gmail message to local storage',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'The Gmail message ID containing the attachment',
              },
              attachmentId: {
                type: 'string',
                description: 'The attachment ID from the message parts',
              },
              filename: {
                type: 'string',
                description: 'Original filename of the attachment',
              },
              savePath: {
                type: 'string',
                description: 'Directory to save the attachment (defaults to Downloads folder)',
              },
              customFilename: {
                type: 'string',
                description: 'Custom filename to save as (optional)',
              },
            },
            required: ['messageId', 'attachmentId', 'filename'],
          },
        },
        {
          name: 'list_gmail_attachments',
          description: 'List all attachments in a Gmail message with download information',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'The Gmail message ID to check for attachments',
              },
            },
            required: ['messageId'],
          },
        },
        {
          name: 'batch_download_attachments',
          description: 'Download multiple attachments from one or more Gmail messages',
          inputSchema: {
            type: 'object',
            properties: {
              downloads: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    messageId: { type: 'string' },
                    attachmentId: { type: 'string' },
                    filename: { type: 'string' },
                    customFilename: { type: 'string' },
                  },
                  required: ['messageId', 'attachmentId', 'filename'],
                },
                description: 'Array of attachment download specifications',
              },
              savePath: {
                type: 'string',
                description: 'Directory to save all attachments (defaults to Downloads folder)',
              },
              createSubfolders: {
                type: 'boolean',
                default: false,
                description: 'Create subfolders by sender/date for organization',
              },
            },
            required: ['downloads'],
          },
        },
        {
          name: 'read_gmail_profile',
          description: 'Get the Gmail profile information for the authenticated user',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.initializeGmailAuth();

        switch (name) {
          case 'search_gmail_messages':
            return await this.searchMessages(args);
          case 'read_gmail_message':
            return await this.readMessage(args);
          case 'read_gmail_thread':
            return await this.readThread(args);
          case 'download_gmail_attachment':
            return await this.downloadAttachment(args);
          case 'list_gmail_attachments':
            return await this.listAttachments(args);
          case 'batch_download_attachments':
            return await this.batchDownloadAttachments(args);
          case 'read_gmail_profile':
            return await this.readProfile();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }
  private async searchMessages(args: any) {
    const { q, maxResults = 100, pageToken } = args;

    const response = await this.auth.gmail.users.messages.list({
      userId: 'me',
      q,
      maxResults,
      pageToken,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            messages: response.data.messages || [],
            nextPageToken: response.data.nextPageToken,
            resultSizeEstimate: response.data.resultSizeEstimate,
          }, null, 2),
        },
      ],
    };
  }

  private async readMessage(args: any) {
    const { messageId, format = 'full' } = args;

    const response = await this.auth.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: format as 'full' | 'minimal' | 'raw',
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async readThread(args: any) {
    const { threadId, includeFullMessages = true } = args;

    const response = await this.auth.gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: includeFullMessages ? 'full' : 'minimal',
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async listAttachments(args: any) {
    const { messageId } = args;

    const message = await this.auth.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const attachments = this.extractAttachmentInfo(message.data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            messageId,
            attachments,
            attachmentCount: attachments.length,
          }, null, 2),
        },
      ],
    };
  }

  private async downloadAttachment(args: any) {
    const { messageId, attachmentId, filename, savePath, customFilename } = args;

    // Use provided path or default to Downloads
    const downloadPath = savePath || this.defaultDownloadPath;
    
    // Ensure directory exists
    await mkdir(downloadPath, { recursive: true });

    // Get attachment data
    const attachment = await this.auth.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    if (!attachment.data.data) {
      throw new Error('No attachment data received');
    }

    // Decode base64url data
    const buffer = Buffer.from(attachment.data.data, 'base64url');
    
    // Determine final filename
    const finalFilename = customFilename || this.sanitizeFilename(filename);
    const fullPath = path.join(downloadPath, finalFilename);

    // Check if file already exists and create unique name if needed
    const uniquePath = await this.getUniqueFilePath(fullPath);

    // Write file
    await writeFile(uniquePath, buffer);

    // Get file stats
    const stats = fs.statSync(uniquePath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            messageId,
            attachmentId,
            originalFilename: filename,
            savedAs: path.basename(uniquePath),
            fullPath: uniquePath,
            size: stats.size,
            sizeFormatted: this.formatFileSize(stats.size),
            downloadedAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async batchDownloadAttachments(args: any) {
    const { downloads, savePath, createSubfolders = false } = args;
    
    const downloadPath = savePath || this.defaultDownloadPath;
    const results: any[] = [];

    for (const download of downloads) {
      try {
        let finalDownloadPath = downloadPath;

        if (createSubfolders) {
          // Get message info for subfolder creation
          const message = await this.auth.gmail.users.messages.get({
            userId: 'me',
            id: download.messageId,
            format: 'minimal',
          });

          const sender = this.extractSender(message.data);
          const date = new Date(parseInt(message.data.internalDate || '0'));
          const subfolder = path.join(downloadPath, 
            this.sanitizeFilename(sender), 
            date.getFullYear().toString()
          );
          
          await mkdir(subfolder, { recursive: true });
          finalDownloadPath = subfolder;
        }

        const result = await this.downloadAttachment({
          ...download,
          savePath: finalDownloadPath,
        });

        results.push({
          success: true,
          messageId: download.messageId,
          attachmentId: download.attachmentId,
          filename: download.filename,
          result: JSON.parse(result.content[0].text),
        });
      } catch (error) {
        results.push({
          success: false,
          messageId: download.messageId,
          attachmentId: download.attachmentId,
          filename: download.filename,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary: {
              total: downloads.length,
              successful,
              failed,
              downloadPath,
            },
            results,
          }, null, 2),
        },
      ],
    };
  }

  private async readProfile() {
    const response = await this.auth.gmail.users.getProfile({
      userId: 'me',
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }
  // Utility methods
  private extractAttachmentInfo(message: any): any[] {
    const attachments: any[] = [];
    
    const extractFromParts = (parts: any[], partId = '') => {
      if (!parts) return;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const currentPartId = partId ? `${partId}.${i}` : i.toString();
        
        if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
          attachments.push({
            partId: currentPartId,
            attachmentId: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            sizeFormatted: this.formatFileSize(part.body.size || 0),
          });
        }
        
        // Recursively check nested parts
        if (part.parts) {
          extractFromParts(part.parts, currentPartId);
        }
      }
    };

    if (message.payload) {
      // Check if the main payload has an attachment
      if (message.payload.filename && message.payload.filename.length > 0 && message.payload.body?.attachmentId) {
        attachments.push({
          partId: '',
          attachmentId: message.payload.body.attachmentId,
          filename: message.payload.filename,
          mimeType: message.payload.mimeType,
          size: message.payload.body.size || 0,
          sizeFormatted: this.formatFileSize(message.payload.body.size || 0),
        });
      }
      
      // Check parts
      extractFromParts(message.payload.parts);
    }

    return attachments;
  }

  private extractSender(message: any): string {
    if (!message.payload?.headers) return 'Unknown';
    
    const fromHeader = message.payload.headers.find((h: any) => h.name.toLowerCase() === 'from');
    if (!fromHeader) return 'Unknown';
    
    // Extract just the name/email part, clean up for folder naming
    const sender = fromHeader.value.replace(/[<>]/g, '').split('@')[0];
    return this.sanitizeFilename(sender);
  }

  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid filename characters
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 200); // Limit length
  }

  private async getUniqueFilePath(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      return filePath;
    }

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const nameWithoutExt = path.basename(filePath, ext);

    let counter = 1;
    let uniquePath: string;

    do {
      uniquePath = path.join(dir, `${nameWithoutExt}_${counter}${ext}`);
      counter++;
    } while (fs.existsSync(uniquePath));

    return uniquePath;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gmail MCP Enhanced server running on stdio');
  }
}

// Create and run the server
const server = new GmailMCPServer();
server.run().catch(console.error);