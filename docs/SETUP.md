# Gmail MCP Detailed Setup Guide

## Table of Contents
1. [Google Cloud Setup](#google-cloud-setup)
2. [OAuth Configuration](#oauth-configuration)
3. [Platform-Specific Installation](#platform-specific-installation)
4. [First Run Authentication](#first-run-authentication)
5. [Advanced Configuration](#advanced-configuration)

## Google Cloud Setup

### Creating a Google Cloud Project

1. **Navigate to Google Cloud Console**
   - Visit https://console.cloud.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click the project dropdown (top left)
   - Click "New Project"
   - Enter project name (e.g., "gmail-mcp-server")
   - Click "Create"

3. **Enable Gmail API**
   ```
   Navigation path:
   ☰ Menu → APIs & Services → Library
   → Search "Gmail API"
   → Click on Gmail API
   → Click "Enable"
   ```

### OAuth Configuration

1. **Configure OAuth Consent Screen**   ```
   Navigation:
   APIs & Services → OAuth consent screen
   ```
   
   Settings:
   - User Type: External (or Internal for Google Workspace)
   - App name: Gmail MCP Server
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add these required scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/gmail.send`

2. **Create OAuth 2.0 Credentials**
   ```
   Navigation:
   APIs & Services → Credentials → Create Credentials → OAuth client ID
   ```
   
   Settings:
   - Application type: Desktop app
   - Name: Gmail MCP Desktop Client
   - Click "Create"
   - **IMPORTANT**: Download the JSON file immediately

## Platform-Specific Installation

### Windows Installation

1. **Install Node.js**
   ```powershell
   # Using winget (Windows Package Manager)   winget install OpenJS.NodeJS
   
   # Or download from https://nodejs.org
   ```

2. **Clone and Install**
   ```powershell
   # Clone repository
   git clone https://github.com/yourusername/gmail-mcp-enhanced.git
   cd gmail-mcp-enhanced
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   ```

3. **Set Environment Variable**
   ```powershell
   # Option 1: Set for current session
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\credentials.json"
   
   # Option 2: Set permanently (requires admin)
   [System.Environment]::SetEnvironmentVariable(
     "GOOGLE_APPLICATION_CREDENTIALS", 
     "C:\path\to\credentials.json", 
     "User"
   )
   ```

### macOS Installation

1. **Install Node.js**   ```bash
   # Using Homebrew
   brew install node
   
   # Or download from https://nodejs.org
   ```

2. **Clone and Install**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/gmail-mcp-enhanced.git
   cd gmail-mcp-enhanced
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   ```

3. **Set Environment Variable**
   ```bash
   # Option 1: Add to .zshrc or .bash_profile
   echo 'export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"' >> ~/.zshrc
   source ~/.zshrc
   
   # Option 2: Create .env file
   echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json" > .env
   ```

### Linux Installation

Similar to macOS, but use your distribution's package manager:```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Fedora
sudo dnf install nodejs npm

# Arch
sudo pacman -S nodejs npm
```

## First Run Authentication

1. **Test Authentication**
   ```bash
   # Run authentication test
   node dist/auth-test.js
   ```

2. **Browser Authentication Flow**
   - A browser window will open
   - Sign in to your Google account
   - Grant requested permissions
   - Copy the authorization code
   - Paste back in terminal

3. **Token Storage**
   - Tokens are stored in `~/.gmail-mcp/tokens.json`
   - This file is automatically created
   - Keep this file secure

## Advanced Configuration

### Using Service Accounts (Optional)

For automated environments without user interaction:1. Create Service Account in Google Cloud Console
2. Enable domain-wide delegation (Google Workspace only)
3. Download service account key
4. Set environment variable to service account key path

### Multiple Account Support

```json
{
  "mcpServers": {
    "gmail-personal": {
      "command": "node",
      "args": ["path/to/gmail-mcp/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "path/to/personal-creds.json",
        "GMAIL_ACCOUNT": "personal@gmail.com"
      }
    },
    "gmail-work": {
      "command": "node",
      "args": ["path/to/gmail-mcp/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "path/to/work-creds.json",
        "GMAIL_ACCOUNT": "work@company.com"
      }
    }
  }
}
```

## Troubleshooting Authentication

### Common Issues

**"Access blocked" error**- Ensure OAuth consent screen is configured
- Add your email to test users if in testing mode
- Publish app if ready for production

**"Invalid grant" error**
- Token has expired
- Delete `~/.gmail-mcp/tokens.json`
- Re-run authentication

**"Quota exceeded" error**
- Check API quotas in Google Cloud Console
- Default is 250 quota units per user per second
- Implement exponential backoff for batch operations

### Security Recommendations

1. **Credential Security**
   - Never commit credentials to git
   - Use `.gitignore` for credential files
   - Rotate credentials regularly

2. **Scope Minimization**
   - Only request necessary scopes
   - Use read-only scopes when possible
   - Review scope usage regularly

3. **Token Management**
   - Store tokens securely
   - Implement token refresh logic
   - Monitor token expiration

## Next Steps

- Continue to [API Reference](./API.md)
- See [Examples](./EXAMPLES.md) for usage
- Review [Contributing Guidelines](../CONTRIBUTING.md)