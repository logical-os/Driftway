# Makefile for Driftway Microservices

.PHONY: help build start stop restart logs clean test

# Default target
help:
	@echo "Driftway Microservices - Available Commands:"
	@echo ""
	@echo "  build     - Build all services"
	@echo "  start     - Start all services"
	@echo "  stop      - Stop all services"
	@echo "  restart   - Restart all services"
	@echo "  logs      - Show logs for all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo "  test      - Run tests for all services"
	@echo "  dev       - Start in development mode"
	@echo ""
	@echo "Individual service commands:"
	@echo "  api       - Build and start API Gateway"
	@echo "  text      - Build and start Text Channels service"
	@echo "  voice     - Build and start Voice Channels service"
	@echo "  db        - Start database services only"

# Build all services
build:
	@echo "Building Driftway microservices..."
	docker-compose build

# Start all services
start:
	@echo "Starting Driftway microservices..."
	docker-compose up -d
	@echo "Services started! Access points:"
	@echo "  API Gateway: http://localhost:8080"
	@echo "  Text Service: http://localhost:4000"
	@echo "  Voice Service: http://localhost:9090"
	@echo "  Load Balancer: http://localhost"
	@echo "  Health Check: http://localhost/health"

# Stop all services
stop:
	@echo "Stopping Driftway microservices..."
	docker-compose down

# Restart all services
restart: stop start

# Show logs
logs:
	docker-compose logs -f

# Clean up
clean:
	@echo "Cleaning up Driftway microservices..."
	docker-compose down -v --rmi all
	docker system prune -f

# Run tests
test:
	@echo "Running tests..."
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down

# Development mode
dev:
	@echo "Starting in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Individual services
api:
	@echo "Building and starting API Gateway..."
	docker-compose up -d --build api-gateway

text:
	@echo "Building and starting Text Channels service..."
	docker-compose up -d --build text-channels

voice:
	@echo "Building and starting Voice Channels service..."
	docker-compose up -d --build voice-channels

db:
	@echo "Starting database services..."
	docker-compose up -d mongodb redis

# Health checks
health:
	@echo "Checking service health..."
	@curl -s http://localhost/health | jq . || echo "Services not running"

# Service status
status:
	@echo "Service status:"
	@docker-compose ps

# View service logs individually
logs-api:
	docker-compose logs -f api-gateway

logs-text:
	docker-compose logs -f text-channels

logs-voice:
	docker-compose logs -f voice-channels

logs-db:
	docker-compose logs -f mongodb redis

# Install dependencies for local development
install-deps:
	@echo "Installing development dependencies..."
	cd api-gateway && go mod download
	cd text-channels && mix deps.get
	cd voice-channels && mkdir -p build && cd build && cmake .. && make -j$(nproc)

# Generate API documentation
docs:
	@echo "Generating API documentation..."
	@echo "API documentation would be generated here"

# Database management
db-migrate:
	@echo "Running database migrations..."
	docker-compose exec text-channels mix ecto.migrate

db-seed:
	@echo "Seeding database..."
	docker-compose exec text-channels mix run priv/repo/seeds.exs

# Monitoring
monitor:
	@echo "Service metrics:"
	@echo "API Gateway: $(shell curl -s http://localhost:8080/health | jq -r .status 2>/dev/null || echo 'down')"
	@echo "Text Service: $(shell curl -s http://localhost:4000/health | jq -r .status 2>/dev/null || echo 'down')"
	@echo "Voice Service: $(shell curl -s http://localhost:9090/health | jq -r .status 2>/dev/null || echo 'down')"