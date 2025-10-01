@echo off
REM Chat Service Monitor Demo/Test
REM This script runs a mock server and launches the monitoring interface

echo.
echo ========================================
echo   Chat Service Monitor - Demo Mode
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

REM Update pip and install dependencies
echo Updating pip and installing dependencies...
python -m pip install --upgrade pip --quiet
python -m pip install rich aiohttp psutil --quiet

echo.
echo Starting mock service on http://localhost:4000...
echo This simulates the Elixir chat service for testing.
echo.

REM Start mock server in background
start "Mock Chat Service" python test_server.py

REM Wait a moment for server to start
timeout /t 3 >nul

echo.
echo Launching monitoring interface...
echo Press Ctrl+C in the monitoring window to stop.
echo.

REM Launch the advanced monitoring interface
python monitoring_advanced.sh

REM Clean up - try to kill the mock server
echo.
echo Cleaning up...
taskkill /FI "WindowTitle eq Mock Chat Service" /T /F >nul 2>&1

echo Demo completed!
pause