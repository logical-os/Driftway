@echo off
REM Elixir Chat Service Setup and Launcher
REM This script helps install Elixir and start the chat service

echo.
echo ========================================
echo   Elixir Chat Service - Setup
echo ========================================
echo.

REM Check if Elixir is installed
elixir --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Elixir is not installed!
    echo.
    echo Please install Elixir first using one of these methods:
    echo.
    echo Option 1: Using Chocolatey (Recommended)
    echo   1. Install Chocolatey: https://chocolatey.org/install
    echo   2. Run: choco install elixir
    echo.
    echo Option 2: Manual Installation
    echo   1. Download from: https://elixir-lang.org/install.html#windows
    echo   2. Follow the installation instructions
    echo.
    echo Option 3: Using Scoop
    echo   1. Install Scoop: https://scoop.sh/
    echo   2. Run: scoop install elixir
    echo.
    echo After installation, restart this terminal and run this script again.
    pause
    exit /b 1
)

echo ✅ Elixir is installed!
elixir --version
echo.

REM Check if mix is available
mix --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Mix (Elixir build tool) is not available
    echo Please reinstall Elixir
    pause
    exit /b 1
)

echo ✅ Mix is available!
echo.

REM Install dependencies
echo Installing Elixir dependencies...
mix deps.get

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies
    echo Try running: mix deps.clean --all
    echo Then: mix deps.get
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

REM Compile the project
echo Compiling the project...
mix compile

if %errorlevel% neq 0 (
    echo.
    echo ❌ Compilation failed
    echo Check the error messages above
    pause
    exit /b 1
)

echo.
echo ✅ Project compiled successfully!
echo.

REM Ask user which mode to start
echo Choose how to start the service:
echo.
echo [1] Single Node (Development)
echo [2] Multi-Node Cluster (3 nodes)
echo [3] Interactive Shell Mode
echo [4] Just show instructions
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto single_node
if "%choice%"=="2" goto multi_node
if "%choice%"=="3" goto interactive
if "%choice%"=="4" goto instructions
goto single_node

:single_node
echo.
echo Starting single node development server...
echo Server will be available at: http://localhost:4000
echo Press Ctrl+C to stop the server
echo.
mix phx.server
goto end

:multi_node
echo.
echo Starting multi-node cluster...
echo.
echo This will open 3 terminal windows for the cluster nodes:
echo - Node 1: http://localhost:4000
echo - Node 2: http://localhost:4001  
echo - Node 3: http://localhost:4002
echo.
echo Press any key to continue...
pause >nul

start "Chat Node 1" cmd /k "iex --name chat1@127.0.0.1 -S mix phx.server"
timeout /t 3 >nul
start "Chat Node 2" cmd /k "set PORT=4001 && iex --name chat2@127.0.0.1 -S mix phx.server"
timeout /t 3 >nul
start "Chat Node 3" cmd /k "set PORT=4002 && iex --name chat3@127.0.0.1 -S mix phx.server"

echo.
echo ✅ Cluster nodes starting...
echo Check the opened terminal windows for each node status
echo Main node available at: http://localhost:4000
goto end

:interactive
echo.
echo Starting interactive shell with Phoenix server...
echo You'll get an IEx prompt where you can inspect the running system
echo Server will be available at: http://localhost:4000
echo.
iex -S mix phx.server
goto end

:instructions
echo.
echo === Manual Start Instructions ===
echo.
echo Single Node:
echo   mix phx.server
echo.
echo Multi-Node Cluster:
echo   Terminal 1: iex --name chat1@127.0.0.1 -S mix phx.server
echo   Terminal 2: PORT=4001 iex --name chat2@127.0.0.1 -S mix phx.server
echo   Terminal 3: PORT=4002 iex --name chat3@127.0.0.1 -S mix phx.server
echo.
echo Interactive Mode:
echo   iex -S mix phx.server
echo.
echo === Test Endpoints ===
echo   Health: curl http://localhost:4000/api/health
echo   Metrics: curl http://localhost:4000/api/metrics
echo   Channels: curl http://localhost:4000/api/channels
echo.
goto end

:end
echo.
echo === Next Steps ===
echo.
echo 1. Test the service endpoints:
echo    Health: http://localhost:4000/api/health
echo    Metrics: http://localhost:4000/api/metrics
echo.
echo 2. Start the monitoring system:
echo    python monitoring_advanced.sh
echo.
echo 3. Or run the demo with mock data:
echo    demo.bat
echo.
pause