#!/bin/bash
# Gmail MCP Enhanced - Automated Setup Script

echo "Gmail MCP Enhanced - Automated Setup"
echo "===================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="Windows"
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
else
    OS="Linux"
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
fi

echo "Detected OS: $OS"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
fi# Check Git
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git first."
    exit 1
else
    echo "✅ Git installed"
fi

echo ""

# Clone repository
echo "Setting up Gmail MCP Enhanced..."
read -p "Enter installation directory (default: ./gmail-mcp-enhanced): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-./gmail-mcp-enhanced}

if [ -d "$INSTALL_DIR" ]; then
    echo "Directory already exists. Updating..."
    cd "$INSTALL_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/yourusername/gmail-mcp-enhanced.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Build project
echo ""
echo "Building project..."npm run build

# Setup credentials
echo ""
echo "Setting up Google Cloud credentials..."
echo ""
echo "Please follow these steps:"
echo "1. Go to https://console.cloud.google.com"
echo "2. Create a new project or select existing"
echo "3. Enable Gmail API"
echo "4. Create OAuth 2.0 credentials (Desktop app)"
echo "5. Download the credentials JSON file"
echo ""
read -p "Enter path to your credentials.json file: " CREDS_PATH

if [ ! -f "$CREDS_PATH" ]; then
    echo "❌ Credentials file not found at: $CREDS_PATH"
    exit 1
fi

# Create .env file
echo ""
echo "Creating environment configuration..."
echo "GOOGLE_APPLICATION_CREDENTIALS=$CREDS_PATH" > .env
echo "✅ Created .env file"

# Update Claude config
echo ""
echo "Updating Claude configuration..."

# Get absolute path
ABS_INSTALL_DIR=$(cd "$INSTALL_DIR" && pwd)

# Create config entryCONFIG_ENTRY=$(cat <<EOF
{
  "gmail-enhanced": {
    "command": "node",
    "args": ["$ABS_INSTALL_DIR/dist/index.js"],
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "$CREDS_PATH"
    }
  }
}
EOF
)

echo ""
echo "Add this to your Claude config at:"
echo "$CONFIG_PATH"
echo ""
echo "$CONFIG_ENTRY"
echo ""

# Install recommended MCPs
echo ""
read -p "Install recommended MCP servers? (y/n): " INSTALL_RECOMMENDED

if [[ $INSTALL_RECOMMENDED =~ ^[Yy]$ ]]; then
    echo ""
    echo "Installing Desktop Commander..."
    npx @wonderwhy-er/desktop-commander@latest --version
    
    echo ""
    echo "Installing GitHub MCP..."
    npx @modelcontextprotocol/server-github --version
    
    echo ""
    echo "✅ Recommended MCPs installed"
fi# Test authentication
echo ""
echo "Testing Gmail authentication..."
read -p "Run authentication test now? (y/n): " RUN_AUTH

if [[ $RUN_AUTH =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting authentication flow..."
    echo "A browser window will open - please sign in and grant permissions."
    echo ""
    node dist/auth-test.js
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the configuration to Claude's config file"
echo "2. Restart Claude Desktop"
echo "3. Look for 'gmail-enhanced' in the MCP menu"
echo ""
echo "For more information, see:"
echo "- README.md - Overview and examples"
echo "- docs/SETUP.md - Detailed setup guide"
echo "- docs/EXAMPLES.md - Usage examples"
echo ""
echo "Happy emailing! 📧"