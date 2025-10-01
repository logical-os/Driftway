#!/bin/bash

# Chat Service Deployment Script
# Usage: ./deploy.sh [command]
# Commands: build, start, stop, restart, logs, scale, health

set -e

PROJECT_NAME="chat-service"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker and docker-compose are installed
check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Build the Docker images
build() {
    print_status "Building Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    print_success "Build completed successfully!"
}

# Start the services
start() {
    print_status "Starting chat services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    check_health
    print_success "All services started successfully!"
    print_status "Services available at:"
    echo "  - Node 1: http://localhost:4000"
    echo "  - Node 2: http://localhost:4001" 
    echo "  - Node 3: http://localhost:4002"
    echo "  - Load Balancer: http://localhost:80"
}

# Stop the services
stop() {
    print_status "Stopping chat services..."
    docker-compose -f $COMPOSE_FILE down
    print_success "Services stopped successfully!"
}

# Restart the services
restart() {
    print_status "Restarting chat services..."
    stop
    start
}

# Show logs
logs() {
    service=${2:-""}
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose -f $COMPOSE_FILE logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose -f $COMPOSE_FILE logs -f $service
    fi
}

# Scale services
scale() {
    replicas=${2:-3}
    print_status "Scaling chat services to $replicas replicas..."
    docker-compose -f $COMPOSE_FILE up -d --scale chat-service=$replicas
    print_success "Services scaled to $replicas replicas!"
}

# Health check
check_health() {
    print_status "Checking service health..."
    
    services=("localhost:4000" "localhost:4001" "localhost:4002")
    
    for service in "${services[@]}"; do
        if curl -f -s "http://$service/health" > /dev/null; then
            print_success "$service is healthy"
        else
            print_warning "$service is not responding"
        fi
    done
    
    # Check load balancer
    if curl -f -s "http://localhost/health" > /dev/null; then
        print_success "Load balancer is healthy"
    else
        print_warning "Load balancer is not responding"
    fi
}

# Show service status
status() {
    print_status "Service status:"
    docker-compose -f $COMPOSE_FILE ps
    
    print_status "\nContainer stats:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
        chat-service-node-1 chat-service-node-2 chat-service-node-3 chat-load-balancer 2>/dev/null || true
}

# Clean up everything
clean() {
    print_warning "This will remove all containers, networks, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker-compose -f $COMPOSE_FILE down -v --rmi all --remove-orphans
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Show help
show_help() {
    echo "Chat Service Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build     Build Docker images"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs (optionally specify service name)"
    echo "  scale     Scale services (default: 3 replicas)"
    echo "  health    Check service health"
    echo "  status    Show service status and stats"
    echo "  clean     Remove all containers and images"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 logs chat-service-1"
    echo "  $0 scale 5"
}

# Main script
main() {
    check_prerequisites
    
    case "${1:-help}" in
        build)
            build
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs "$@"
            ;;
        scale)
            scale "$@"
            ;;
        health)
            check_health
            ;;
        status)
            status
            ;;
        clean)
            clean
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"