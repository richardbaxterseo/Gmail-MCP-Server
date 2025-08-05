#!/usr/bin/env node

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

class GmailAuth {
  private oauth2Client: any;
  private tokenPath: string;

  constructor() {
    this.tokenPath = path.join(os.homedir(), '.gmail-mcp', 'tokens.json');
  }

  async authenticate() {
    try {
      console.log('🔐 Gmail MCP Authentication Setup');
      console.log('=====================================\n');

      // Load credentials
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!credentialsPath) {
        throw new Error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      }

      console.log(`📁 Loading credentials from: ${credentialsPath}`);
      const credentialsContent = await readFile(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsContent);

      // Set up OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris?.[0] || 'urn:ietf:wg:oauth:2.0:oob'
      );

      // Check for existing tokens
      try {
        console.log(`🔍 Checking for existing tokens...`);
        const tokenContent = await readFile(this.tokenPath, 'utf8');
        const tokens = JSON.parse(tokenContent);
        this.oauth2Client.setCredentials(tokens);
        
        console.log('✅ Found existing tokens, testing connection...');
        await this.testConnection();
        console.log('🎉 Authentication successful! Gmail MCP is ready to use.');
        return;
      } catch (error) {
        console.log('🔑 No valid tokens found, starting authorization flow...\n');
      }

      // Start authorization flow
      await this.authorizeNewToken();
      
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      process.exit(1);
    }
  }

  private async authorizeNewToken() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.send'
      ],
    });

    console.log('🌐 Opening authorization URL in your browser...');
    console.log('If the browser doesn\'t open automatically, copy this URL:');
    console.log(`\n${authUrl}\n`);

    // Try to open the URL automatically
    const { default: open } = await import('open');
    try {
      await open(authUrl);
    } catch (error) {
      console.log('⚠️  Could not open browser automatically. Please open the URL manually.');
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise<string>((resolve) => {
      rl.question('📋 Enter the authorization code from the browser: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    console.log('\n🔄 Exchanging code for tokens...');
    
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Save tokens
    await mkdir(path.dirname(this.tokenPath), { recursive: true });
    await writeFile(this.tokenPath, JSON.stringify(tokens, null, 2));

    console.log(`💾 Tokens saved to: ${this.tokenPath}`);
    
    // Test the connection
    await this.testConnection();
    console.log('\n🎉 Gmail MCP authentication complete!');
    console.log('You can now use the Gmail MCP server with Claude.');
  }

  private async testConnection() {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      console.log(`✅ Connected to Gmail account: ${profile.data.emailAddress}`);
      console.log(`📊 Total messages: ${profile.data.messagesTotal?.toLocaleString()}`);
      console.log(`📧 Total threads: ${profile.data.threadsTotal?.toLocaleString()}`);
    } catch (error) {
      throw new Error(`Failed to connect to Gmail: ${error}`);
    }
  }
}

// Run authentication
const auth = new GmailAuth();
auth.authenticate().catch(console.error);