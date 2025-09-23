@echo off
REM Start the Driftway Test UI Server
REM This batch file starts a simple HTTP server for the test UI

echo.
echo ========================================
echo   Driftway Test UI Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    echo.
    pause
    exit /b 1
)

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Starting server...
echo.
echo You can access the Test UI at:
echo   http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the Python server
python server.py

pause