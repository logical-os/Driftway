# Elixir Installation Script for Windows
# This script helps install Elixir using Chocolatey

Write-Host ""
Write-Host "========================================"  -ForegroundColor Blue
Write-Host "   Elixir Installation Helper"  -ForegroundColor Blue
Write-Host "========================================"  -ForegroundColor Blue
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Note: Running without administrator privileges" -ForegroundColor Yellow
    Write-Host "   Some installation methods may require admin access" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Elixir is already installed
try {
    $elixirVersion = & elixir --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Elixir is already installed!" -ForegroundColor Green
        Write-Host $elixirVersion
        Write-Host ""
        Write-Host "You can now run: start_service.bat"
        Read-Host "Press Enter to continue"
        exit 0
    }
} catch {
    # Elixir not found, continue with installation
}

Write-Host "Elixir is not installed. Choose an installation method:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Install via Chocolatey (Recommended)" -ForegroundColor Cyan
Write-Host "[2] Install via Scoop" -ForegroundColor Cyan  
Write-Host "[3] Manual Download (opens browser)" -ForegroundColor Cyan
Write-Host "[4] Show installation instructions only" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Installing via Chocolatey..." -ForegroundColor Green
        
        # Check if Chocolatey is installed
        try {
            & choco --version 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Chocolatey not found" }
            Write-Host "✅ Chocolatey is available" -ForegroundColor Green
        } catch {
            Write-Host "Installing Chocolatey first..." -ForegroundColor Yellow
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        }
        
        Write-Host "Installing Elixir..." -ForegroundColor Green
        & choco install elixir -y
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Elixir installed successfully!" -ForegroundColor Green
            Write-Host "Please restart your terminal and run start_service.bat" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Installation failed. Try manual installation." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "Installing via Scoop..." -ForegroundColor Green
        
        # Check if Scoop is installed
        try {
            & scoop --version 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Scoop not found" }
            Write-Host "✅ Scoop is available" -ForegroundColor Green
        } catch {
            Write-Host "Installing Scoop first..." -ForegroundColor Yellow
            Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            Invoke-RestMethod get.scoop.sh | Invoke-Expression
        }
        
        Write-Host "Installing Elixir..." -ForegroundColor Green
        & scoop install elixir
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Elixir installed successfully!" -ForegroundColor Green
            Write-Host "Please restart your terminal and run start_service.bat" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Installation failed. Try manual installation." -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Opening manual download pages..." -ForegroundColor Green
        Start-Process "https://elixir-lang.org/install.html#windows"
        Write-Host ""
        Write-Host "Instructions:" -ForegroundColor Yellow
        Write-Host "1. Download and install Erlang first"
        Write-Host "2. Download and install Elixir"
        Write-Host "3. Restart your terminal"
        Write-Host "4. Run start_service.bat"
    }
    
    "4" {
        Write-Host ""
        Write-Host "=== Installation Instructions ===" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Method 1: Chocolatey (Recommended)" -ForegroundColor Yellow
        Write-Host "  1. Install Chocolatey: https://chocolatey.org/install"
        Write-Host "  2. Run: choco install elixir"
        Write-Host ""
        Write-Host "Method 2: Scoop" -ForegroundColor Yellow  
        Write-Host "  1. Install Scoop: https://scoop.sh/"
        Write-Host "  2. Run: scoop install elixir"
        Write-Host ""
        Write-Host "Method 3: Manual" -ForegroundColor Yellow
        Write-Host "  1. Download Erlang: https://erlang.org/downloads"
        Write-Host "  2. Download Elixir: https://elixir-lang.org/install.html#windows"
        Write-Host "  3. Install both (Erlang first)"
        Write-Host ""
        Write-Host "After installation:" -ForegroundColor Cyan
        Write-Host "  - Restart terminal"
        Write-Host "  - Run: start_service.bat"
    }
    
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "Press Enter to exit"