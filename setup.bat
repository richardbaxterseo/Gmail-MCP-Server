@echo off
REM Gmail MCP Enhanced - Windows Setup Script

echo Gmail MCP Enhanced - Windows Setup
echo ==================================
echo.

REM Check prerequisites
echo Checking prerequisites...

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js not found. Please install Node.js 18+ first.
    echo   Visit: https://nodejs.org
    pause
    exit /b 1
) else (
    for /f "delims=" %%i in ('node -v') do set NODE_VERSION=%%i
    echo √ Node.js installed: %NODE_VERSION%
)

REM Check Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Git not found. Please install Git first.
    pause
    exit /b 1
) else (
    echo √ Git installed
)

echo.REM Clone repository
echo Setting up Gmail MCP Enhanced...
set /p INSTALL_DIR="Enter installation directory (default: gmail-mcp-enhanced): "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=gmail-mcp-enhanced

if exist "%INSTALL_DIR%" (
    echo Directory already exists. Updating...
    cd "%INSTALL_DIR%"
    git pull
) else (
    echo Cloning repository...
    git clone https://github.com/yourusername/gmail-mcp-enhanced.git "%INSTALL_DIR%"
    cd "%INSTALL_DIR%"
)

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

REM Build project
echo.
echo Building project...
call npm run build

REM Setup credentials
echo.
echo Setting up Google Cloud credentials...
echo.
echo Please follow these steps:
echo 1. Go to https://console.cloud.google.com
echo 2. Create a new project or select existing
echo 3. Enable Gmail APIecho 4. Create OAuth 2.0 credentials (Desktop app)
echo 5. Download the credentials JSON file
echo.
set /p CREDS_PATH="Enter path to your credentials.json file: "

if not exist "%CREDS_PATH%" (
    echo X Credentials file not found at: %CREDS_PATH%
    pause
    exit /b 1
)

REM Create .env file
echo.
echo Creating environment configuration...
echo GOOGLE_APPLICATION_CREDENTIALS=%CREDS_PATH% > .env
echo √ Created .env file

REM Get absolute path
for %%i in ("%CD%") do set ABS_INSTALL_DIR=%%~fi

REM Update Claude config
echo.
echo Updating Claude configuration...
echo.
echo Add this to your Claude config at:
echo %APPDATA%\Claude\claude_desktop_config.json
echo.
echo {
echo   "gmail-enhanced": {
echo     "command": "node",
echo     "args": ["%ABS_INSTALL_DIR%\dist\index.js"],
echo     "env": {echo       "GOOGLE_APPLICATION_CREDENTIALS": "%CREDS_PATH%"
echo     }
echo   }
echo }
echo.

REM Install recommended MCPs
set /p INSTALL_RECOMMENDED="Install recommended MCP servers? (y/n): "

if /i "%INSTALL_RECOMMENDED%"=="y" (
    echo.
    echo Installing Desktop Commander...
    call npx @wonderwhy-er/desktop-commander@latest --version
    
    echo.
    echo Installing GitHub MCP...
    call npx @modelcontextprotocol/server-github --version
    
    echo.
    echo √ Recommended MCPs installed
)

REM Test authentication
echo.
echo Testing Gmail authentication...
set /p RUN_AUTH="Run authentication test now? (y/n): "

if /i "%RUN_AUTH%"=="y" (
    echo.
    echo Starting authentication flow...
    echo A browser window will open - please sign in and grant permissions.
    echo.
    node dist\auth-test.js
)echo.
echo √ Setup complete!
echo.
echo Next steps:
echo 1. Add the configuration to Claude's config file
echo 2. Restart Claude Desktop
echo 3. Look for 'gmail-enhanced' in the MCP menu
echo.
echo For more information, see:
echo - README.md - Overview and examples
echo - docs\SETUP.md - Detailed setup guide
echo - docs\EXAMPLES.md - Usage examples
echo.
echo Happy emailing! 📧
echo.
pause