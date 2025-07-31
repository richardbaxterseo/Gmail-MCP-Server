# Gmail MCP Server - Enhanced Edition

A Model Context Protocol (MCP) server for Gmail integration with powerful search, filtering, and automated processing capabilities.

## 🚀 Features

- **Advanced Email Search** - Full Gmail search syntax support
- **Batch Operations** - Process multiple emails efficiently
- **Attachment Management** - Download and organise attachments
- **Label Management** - Create, update, and apply labels
- **Tax Invoice Processing** - Extract financial data for accounting
- **Cross-Platform** - Works on Windows, macOS, and Linux

## 📋 Prerequisites

- Node.js 18+ 
- Gmail account with API access enabled
- Google Cloud Console project
- OAuth 2.0 credentials

## 🔧 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/gmail-mcp-enhanced.git
cd gmail-mcp-enhanced
npm install
```

### Step 2: Set Up Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app"
   - Download the credentials JSON file

### Step 3: Configure Environment

#### Windows
```bash
# Create .env file in project root
echo GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\credentials.json > .env
```

#### macOS/Linux
```bash
# Create .env file in project root
echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials.json" > .env
```

### Step 4: Build the Server

```bash
npm run build
```

## 🔌 MCP Configuration

### Windows Configuration
Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["C:\\path\\to\\gmail-mcp-enhanced\\dist\\index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\path\\to\\credentials.json"
      }
    }
  }
}
```

### macOS Configuration
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "node", 
      "args": ["/path/to/gmail-mcp-enhanced/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json"
      }
    }
  }
}
```

## 📚 Usage Examples

### Basic Email Search
```
Search for invoices from 2024:
gmail:search_emails with query "subject:invoice after:2024/01/01"
```

### Tax Invoice Processing
```
Process tax invoices:
gmail:search_emails with query "(subject:invoice OR subject:receipt) has:attachment after:2024/04/01"
```

### Batch Operations
```
Archive old emails:
gmail:batch_modify_emails with messageIds and addLabelIds ["ARCHIVED"]
```

## 🤝 Recommended Companion MCPs

For a complete email automation setup, we recommend:

1. **Desktop Commander** - File system operations
   ```bash
   npx @wonderwhy-er/desktop-commander@latest
   ```

2. **Nova Memory** - Persistent data storage
   ```bash
   npm install nova-memory-mcp
   ```

3. **GitHub MCP** - Version control integration
   ```bash
   npx @modelcontextprotocol/server-github
   ```

## 🔒 Security Best Practices

- Never commit credentials to git
- Use environment variables for sensitive data
- Regularly rotate OAuth tokens
- Review Gmail API permissions

## 🐛 Troubleshooting

### Common Issues

**Authentication Failed**
- Ensure credentials.json is valid
- Check file path in environment variable
- Verify Gmail API is enabled

**Permission Denied**
- Run first authentication in terminal
- Check OAuth consent screen settings
- Ensure correct scopes are requested

## 📖 Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed installation instructions
- [API Reference](./docs/API.md) - Complete function documentation
- [Examples](./docs/EXAMPLES.md) - Real-world usage scenarios
- [Contributing](./CONTRIBUTING.md) - Development guidelines

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🙏 Acknowledgments

Built on the MCP SDK by Anthropic
Gmail API by Google
Community contributors and testers