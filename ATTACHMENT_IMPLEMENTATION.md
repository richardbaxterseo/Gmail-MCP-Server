# Gmail Attachment Download Development Guide

## Overview
This document outlines the implementation of Gmail attachment download functionality for the Gmail MCP Server. The implementation provides robust attachment handling with smart file management and error handling.

## Key Features Implemented

### 1. **Individual Attachment Download** (`download_gmail_attachment`)
- Downloads single attachments with full error handling
- Automatic file name sanitization and conflict resolution
- Defaults to Windows Downloads directory unless specified
- Returns detailed download information including file size and path

### 2. **Attachment Listing** (`list_gmail_attachments`)
- Lists all attachments in a message with metadata
- Provides attachment IDs needed for downloading
- Shows file sizes, MIME types, and filenames
- Handles nested multipart messages correctly

### 3. **Batch Download** (`batch_download_attachments`)
- Downloads multiple attachments in one operation
- Optional subfolder organization by sender/date
- Comprehensive success/failure reporting
- Individual error handling per attachment

### 4. **Enhanced Message Reading**
- Full message content with attachment information
- Proper handling of multipart/mixed messages
- Thread reading with attachment context

## Implementation Details

### Attachment Detection Algorithm
```typescript
private extractAttachmentInfo(message: any): any[] {
  // Recursively searches message parts for attachments
  // Handles nested multipart structures
  // Extracts: filename, attachmentId, mimeType, size
}
```

### Download Process
1. **Validate Parameters**: Ensure messageId, attachmentId, and filename are provided
2. **Create Directory**: Ensure download directory exists (defaults to ~/Downloads)
3. **Fetch Attachment**: Use Gmail API to get attachment data
4. **Decode Data**: Convert base64url encoded data to buffer
5. **Handle Conflicts**: Create unique filename if file exists
6. **Write File**: Save to disk with proper error handling
7. **Return Metadata**: Provide download confirmation with file details

### File Management Features
- **Sanitization**: Removes invalid filename characters
- **Conflict Resolution**: Automatically appends numbers for duplicates
- **Path Safety**: Validates and creates directory structures
- **Size Formatting**: Human-readable file size reporting

## Usage Examples

### Basic Attachment Download
```javascript
// 1. Search for emails with attachments
const results = await gmail.search_gmail_messages({
  q: "has:attachment subject:invoice"
});

// 2. List attachments in a message
const attachments = await gmail.list_gmail_attachments({
  messageId: "18abc123def456789"
});

// 3. Download specific attachment
const download = await gmail.download_gmail_attachment({
  messageId: "18abc123def456789",
  attachmentId: "ANGjdJ8...", // From attachments list
  filename: "invoice.pdf"
});
```

### Batch Download with Organization
```javascript
// Download multiple attachments with subfolder organization
const batchDownload = await gmail.batch_download_attachments({
  downloads: [
    {
      messageId: "msg1",
      attachmentId: "att1",
      filename: "invoice1.pdf"
    },
    {
      messageId: "msg2", 
      attachmentId: "att2",
      filename: "receipt.pdf",
      customFilename: "2024_receipt.pdf"
    }
  ],
  savePath: "C:\\tax-documents",
  createSubfolders: true // Creates sender/year subfolders
});
```

### Invoice Processing Workflow
```javascript
// Complete invoice processing pipeline
const invoiceEmails = await gmail.search_gmail_messages({
  q: "subject:invoice has:attachment after:2024/01/01"
});

for (const message of invoiceEmails.messages) {
  // Get full message with attachment info
  const messageData = await gmail.read_gmail_message({
    messageId: message.id
  });
  
  // List all attachments
  const attachments = await gmail.list_gmail_attachments({
    messageId: message.id
  });
  
  // Download PDF attachments only
  const pdfAttachments = attachments.attachments.filter(
    att => att.mimeType === 'application/pdf'
  );
  
  if (pdfAttachments.length > 0) {
    await gmail.batch_download_attachments({
      downloads: pdfAttachments.map(att => ({
        messageId: message.id,
        attachmentId: att.attachmentId,
        filename: att.filename
      })),
      createSubfolders: true
    });
  }
}
```

## Error Handling

### Comprehensive Error Coverage
- **Authentication Errors**: Clear messaging for OAuth issues
- **API Errors**: Gmail API rate limits and quota handling
- **File System Errors**: Permission, disk space, path issues
- **Data Errors**: Malformed attachments, encoding problems

### Graceful Degradation
- Individual attachment failures don't stop batch operations
- Detailed error reporting per attachment
- Automatic retry logic for transient failures
- Clear success/failure metrics

## Security Considerations

### Data Protection
- Tokens stored securely in user home directory
- No credential logging or exposure
- Proper file permission handling
- Attachment data never cached

### Access Control
- OAuth2 with minimal required scopes
- User consent for each Gmail account
- Automatic token refresh handling
- Secure credential file handling

## Performance Optimizations

### Efficient Processing
- Batch operations for multiple downloads
- Minimal API calls through smart caching
- Stream processing for large attachments
- Parallel download support

### Resource Management
- Memory-efficient buffer handling
- Automatic cleanup of temporary data
- Progress reporting for large operations
- Configurable concurrency limits

## Development Notes

### Prerequisites
- Node.js 18+
- Google Cloud Console project with Gmail API enabled
- OAuth 2.0 desktop application credentials
- Proper environment variable configuration

### Build Process
```bash
npm install
npm run build
npm run auth:test  # First-time authentication
```

### Testing Strategy
- Unit tests for attachment extraction logic
- Integration tests with real Gmail data
- Error condition testing
- Performance benchmarking

## Integration with Tax Invoice Processing

This attachment download functionality directly addresses the issues identified in the invoice processing system:

### Problems Solved
✅ **Real Attachment Download**: No more fake "att123" IDs
✅ **Actual PDF Retrieval**: Downloads real files to filesystem
✅ **Proper File Management**: Organized storage with conflict resolution
✅ **Full Integration**: Works with existing Gmail search and message reading

### Workflow Integration
```javascript
// Complete tax invoice workflow
const taxInvoices = await gmail.search_gmail_messages({
  q: "(subject:invoice OR subject:receipt) has:attachment after:2024/04/01 before:2025/03/31"
});

const allDownloads = [];

for (const message of taxInvoices.messages) {
  const attachments = await gmail.list_gmail_attachments({
    messageId: message.id
  });
  
  const pdfAttachments = attachments.attachments.filter(
    att => att.filename.toLowerCase().endsWith('.pdf')
  );
  
  allDownloads.push(...pdfAttachments.map(att => ({
    messageId: message.id,
    attachmentId: att.attachmentId,
    filename: att.filename
  })));
}

// Batch download all tax documents
const results = await gmail.batch_download_attachments({
  downloads: allDownloads,
  savePath: "C:\\tax-receipts-2024-25\\attachments",
  createSubfolders: true
});

console.log(`Downloaded ${results.summary.successful} tax documents`);
```

## Production Deployment

### File Structure
```
C:\mcp\Gmail-MCP-Server\    # Production location
├── dist\
│   ├── index.js           # Compiled main server
│   └── auth-test.js       # Authentication helper
├── package.json
├── .env                   # Production environment
└── credentials.json       # OAuth credentials
```

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["C:\\mcp\\Gmail-MCP-Server\\dist\\index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\mcp\\Gmail-MCP-Server\\credentials.json"
      }
    }
  }
}
```

This implementation provides a complete solution for Gmail attachment downloading with enterprise-grade error handling, security, and performance considerations.