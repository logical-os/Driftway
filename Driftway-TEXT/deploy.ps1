# Chat Service Deployment Script for Windows PowerShell
# Usage: .\deploy.ps1 [command]
# Commands: build, start, stop, restart, logs, scale, health

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service = "",
    
    [Parameter(Position=2)]
    [int]$Replicas = 3
)

$ErrorActionPreference = "Stop"

$PROJECT_NAME = "chat-service"
$COMPOSE_FILE = "docker-compose.yml"

# Check if Docker and Docker Compose are installed
function Test-Prerequisites {
    Write-Host "[INFO] Checking prerequisites..." -ForegroundColor Blue
    
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Host "[ERROR] Docker is not installed or not in PATH. Please install Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    try {
        docker-compose --version | Out-Null
    }
    catch {
        Write-Host "[ERROR] Docker Compose is not installed or not in PATH." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[SUCCESS] Prerequisites check passed!" -ForegroundColor Green
}

# Build the Docker images
function Build-Images {
    Write-Host "[INFO] Building Docker images..." -ForegroundColor Blue
    docker-compose -f $COMPOSE_FILE build --no-cache
    Write-Host "[SUCCESS] Build completed successfully!" -ForegroundColor Green
}

# Start the services
function Start-Services {
    Write-Host "[INFO] Starting chat services..." -ForegroundColor Blue
    docker-compose -f $COMPOSE_FILE up -d
    
    Write-Host "[INFO] Waiting for services to be healthy..." -ForegroundColor Blue
    Start-Sleep -Seconds 30
    
    Test-Health
    Write-Host "[SUCCESS] All services started successfully!" -ForegroundColor Green
    Write-Host "[INFO] Services available at:" -ForegroundColor Blue
    Write-Host "  - Node 1: http://localhost:4000" -ForegroundColor Cyan
    Write-Host "  - Node 2: http://localhost:4001" -ForegroundColor Cyan
    Write-Host "  - Node 3: http://localhost:4002" -ForegroundColor Cyan
    Write-Host "  - Load Balancer: http://localhost:80" -ForegroundColor Cyan
}

# Stop the services
function Stop-Services {
    Write-Host "[INFO] Stopping chat services..." -ForegroundColor Blue
    docker-compose -f $COMPOSE_FILE down
    Write-Host "[SUCCESS] Services stopped successfully!" -ForegroundColor Green
}

# Restart the services
function Restart-Services {
    Write-Host "[INFO] Restarting chat services..." -ForegroundColor Blue
    Stop-Services
    Start-Services
}

# Show logs
function Show-Logs {
    if ([string]::IsNullOrEmpty($Service)) {
        Write-Host "[INFO] Showing logs for all services..." -ForegroundColor Blue
        docker-compose -f $COMPOSE_FILE logs -f
    } else {
        Write-Host "[INFO] Showing logs for $Service..." -ForegroundColor Blue
        docker-compose -f $COMPOSE_FILE logs -f $Service
    }
}

# Scale services
function Scale-Services {
    Write-Host "[INFO] Scaling chat services to $Replicas replicas..." -ForegroundColor Blue
    docker-compose -f $COMPOSE_FILE up -d --scale chat-service=$Replicas
    Write-Host "[SUCCESS] Services scaled to $Replicas replicas!" -ForegroundColor Green
}

# Health check
function Test-Health {
    Write-Host "[INFO] Checking service health..." -ForegroundColor Blue
    
    $services = @("localhost:4000", "localhost:4001", "localhost:4002")
    
    foreach ($serviceUrl in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://$serviceUrl/health" -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "[SUCCESS] $serviceUrl is healthy" -ForegroundColor Green
            } else {
                Write-Host "[WARNING] $serviceUrl returned status code: $($response.StatusCode)" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "[WARNING] $serviceUrl is not responding" -ForegroundColor Yellow
        }
    }
    
    # Check load balancer
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] Load balancer is healthy" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Load balancer returned status code: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[WARNING] Load balancer is not responding" -ForegroundColor Yellow
    }
}

# Show service status
function Show-Status {
    Write-Host "[INFO] Service status:" -ForegroundColor Blue
    docker-compose -f $COMPOSE_FILE ps
    
    Write-Host "`n[INFO] Container stats:" -ForegroundColor Blue
    try {
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" chat-service-node-1 chat-service-node-2 chat-service-node-3 chat-load-balancer
    }
    catch {
        Write-Host "[WARNING] Could not retrieve container stats" -ForegroundColor Yellow
    }
}

# Clean up everything
function Remove-All {
    Write-Host "[WARNING] This will remove all containers, networks, and images. Are you sure? (y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -match "^[yY]([eE][sS])?$") {
        Write-Host "[INFO] Cleaning up..." -ForegroundColor Blue
        docker-compose -f $COMPOSE_FILE down -v --rmi all --remove-orphans
        Write-Host "[SUCCESS] Cleanup completed!" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Cleanup cancelled." -ForegroundColor Blue
    }
}

# Show help
function Show-Help {
    Write-Host "Chat Service Deployment Script for Windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [command] [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  build     Build Docker images" -ForegroundColor White
    Write-Host "  start     Start all services" -ForegroundColor White
    Write-Host "  stop      Stop all services" -ForegroundColor White
    Write-Host "  restart   Restart all services" -ForegroundColor White
    Write-Host "  logs      Show logs (optionally specify service name)" -ForegroundColor White
    Write-Host "  scale     Scale services (default: 3 replicas)" -ForegroundColor White
    Write-Host "  health    Check service health" -ForegroundColor White
    Write-Host "  status    Show service status and stats" -ForegroundColor White
    Write-Host "  clean     Remove all containers and images" -ForegroundColor White
    Write-Host "  help      Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1 build" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1 start" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1 logs chat-service-1" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1 scale 5" -ForegroundColor Cyan
}

# Main script execution
Test-Prerequisites

switch ($Command.ToLower()) {
    "build" { Build-Images }
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "logs" { Show-Logs }
    "scale" { Scale-Services }
    "health" { Test-Health }
    "status" { Show-Status }
    "clean" { Remove-All }
    default { Show-Help }
}