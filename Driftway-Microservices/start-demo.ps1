# Driftway Simple Server Launcher
# This script will start a simplified version of Driftway

Write-Host "🚀 Driftway Microservices Launcher" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if Go is installed
if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Host "✅ Go found! Starting simple server..." -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Server will be available at: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "📱 Open your browser to see the demo interface" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    # Run the simple server
    go run simple-server.go
} else {
    Write-Host "❌ Go is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run this demo, you need to install Go first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1 - Download from official site:" -ForegroundColor White
    Write-Host "  1. Visit: https://golang.org/dl/" -ForegroundColor Cyan
    Write-Host "  2. Download Go for Windows" -ForegroundColor Cyan
    Write-Host "  3. Run the installer" -ForegroundColor Cyan
    Write-Host "  4. Restart PowerShell" -ForegroundColor Cyan
    Write-Host "  5. Run this script again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 2 - Using Chocolatey (if installed):" -ForegroundColor White
    Write-Host "  choco install golang" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 3 - Using Winget:" -ForegroundColor White
    Write-Host "  winget install GoLang.Go" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Go, run this script again:" -ForegroundColor Yellow
    Write-Host "  .\start-demo.ps1" -ForegroundColor Cyan
    Write-Host ""
    
    # Alternative: Show how to install Go using winget if available
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "🔧 Auto-install option available!" -ForegroundColor Green
        $install = Read-Host "Would you like to install Go automatically using winget? (y/n)"
        if ($install -eq "y" -or $install -eq "Y") {
            Write-Host "Installing Go..." -ForegroundColor Blue
            winget install GoLang.Go
            Write-Host ""
            Write-Host "✅ Go installation complete!" -ForegroundColor Green
            Write-Host "Please restart PowerShell and run this script again." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "💡 For the full microservices experience:" -ForegroundColor Yellow
Write-Host "  1. Install Docker Desktop" -ForegroundColor White
Write-Host "  2. Run: docker-compose up -d" -ForegroundColor Cyan
Write-Host ""