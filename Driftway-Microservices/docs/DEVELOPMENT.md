# Development Guide

This guide covers how to set up and develop the Driftway microservices locally.

## Prerequisites

### Required Software

#### For Full Development Setup
- **Go**: Version 1.21 or higher
  - Download: https://golang.org/dl/
  - Verify: `go version`

- **Elixir**: Version 1.15 or higher
  - Download: https://elixir-lang.org/install.html
  - Verify: `elixir --version`

- **Node.js**: Version 18 or higher (for Phoenix assets)
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **Visual Studio Build Tools** (Windows) or **GCC** (Linux/Mac)
  - Windows: Visual Studio Community 2022 with C++ workload
  - Linux: `sudo apt install build-essential cmake`
  - Mac: `xcode-select --install`

#### For Database Services
- **MongoDB**: Version 7.0 or higher
  - Download: https://www.mongodb.com/try/download/community
  - Verify: `mongod --version`

- **Redis**: Version 7 or higher
  - Windows: Use WSL or Redis for Windows
  - Linux: `sudo apt install redis-server`
  - Mac: `brew install redis`
  - Verify: `redis-server --version`

#### For Docker Development
- **Docker Desktop** or **Docker Engine**
  - Download: https://www.docker.com/products/docker-desktop/
  - Verify: `docker --version`

- **Docker Compose**
  - Usually included with Docker Desktop
  - Verify: `docker-compose --version`

## Project Structure

```
Driftway-Microservices/
├── api-gateway/                 # Go API Gateway service
│   ├── cmd/                     # Application entry points
│   ├── internal/                # Private application code
│   │   ├── auth/               # Authentication logic
│   │   ├── config/             # Configuration management
│   │   ├── database/           # Database connections
│   │   ├── middleware/         # HTTP middleware
│   │   └── services/           # Business logic services
│   ├── go.mod                  # Go module definition
│   ├── go.sum                  # Go module checksums
│   ├── main.go                 # Application entry point
│   └── Dockerfile              # Container build instructions
│
├── text-channels/              # Elixir Phoenix service
│   ├── config/                 # Phoenix configuration
│   ├── lib/                    # Application code
│   │   ├── text_channels/      # Core application logic
│   │   │   ├── messaging/      # Message handling
│   │   │   ├── channels/       # Channel management
│   │   │   └── presence/       # User presence tracking
│   │   └── text_channels_web/  # Web layer (controllers, channels)
│   ├── priv/                   # Private assets and migrations
│   ├── assets/                 # Frontend assets
│   ├── mix.exs                 # Elixir project configuration
│   ├── mix.lock                # Dependency lock file
│   └── Dockerfile              # Container build instructions
│
├── voice-channels/             # C++ voice service
│   ├── include/                # Header files
│   │   ├── voice_server.h      # Main server class
│   │   ├── voice_channel.h     # Channel management
│   │   └── audio_processor.h   # Audio processing
│   ├── src/                    # Source files
│   │   ├── main.cpp            # Application entry point
│   │   ├── voice_server.cpp    # Server implementation
│   │   └── voice_channel.cpp   # Channel implementation
│   ├── CMakeLists.txt          # CMake build configuration
│   └── Dockerfile              # Container build instructions
│
├── nginx/                      # Load balancer configuration
│   ├── nginx.conf              # Main Nginx configuration
│   └── ssl/                    # SSL certificates (if using HTTPS)
│
├── docs/                       # Documentation
│   ├── API.md                  # API documentation
│   ├── ARCHITECTURE.md         # Architecture overview
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── TROUBLESHOOTING.md      # Common issues and solutions
│
├── scripts/                    # Utility scripts
│   ├── setup.sh               # Development setup script
│   ├── test.sh                # Test runner script
│   └── deploy.sh              # Deployment script
│
├── docker-compose.yml          # Docker services configuration
├── docker-compose.prod.yml     # Production Docker configuration
├── Makefile                    # Build and development commands
└── README.md                   # Project overview
```

## Local Development Setup

### Option 1: Docker Development (Recommended)

This is the easiest way to get started as it handles all dependencies.

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Driftway-Microservices
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Check service status**:
   ```bash
   docker-compose ps
   ```

4. **View logs**:
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f api-gateway
   ```

5. **Stop services**:
   ```bash
   docker-compose down
   ```

### Option 2: Native Development

For active development, running services natively provides faster feedback loops.

#### Step 1: Start Database Services

```bash
# Start MongoDB (in separate terminal)
mongod --dbpath ./data/db

# Start Redis (in separate terminal)
redis-server
```

#### Step 2: Start API Gateway (Go)

```bash
cd api-gateway

# Install dependencies
go mod download

# Set environment variables
export MONGO_URI="mongodb://localhost:27017/driftway"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="your-jwt-secret-key"
export TEXT_SERVICE_URL="http://localhost:4000"
export VOICE_SERVICE_URL="http://localhost:9090"
export PORT="8080"

# Run the service
go run main.go
```

#### Step 3: Start Text Channels Service (Elixir)

```bash
cd text-channels

# Install dependencies
mix deps.get

# Set environment variables
export DATABASE_URL="mongodb://localhost:27017/driftway"
export REDIS_URL="redis://localhost:6379"
export SECRET_KEY_BASE="your-phoenix-secret-key"
export PORT="4000"

# Install Node.js dependencies for assets
cd assets && npm install && cd ..

# Start Phoenix server
mix phx.server
```

#### Step 4: Start Voice Channels Service (C++)

```bash
cd voice-channels

# Create build directory
mkdir -p build && cd build

# Configure with CMake
cmake ..

# Build the application
make

# Set environment variables
export MONGO_URI="mongodb://localhost:27017/driftway"
export REDIS_URL="redis://localhost:6379"
export PORT="9090"

# Run the service
./voice_server
```

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make your changes** in the appropriate service directory

3. **Test your changes**:
   ```bash
   # Run tests for specific service
   cd api-gateway && go test ./...
   cd text-channels && mix test
   cd voice-channels && make test
   ```

4. **Build and test with Docker**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

### Code Style and Standards

#### Go (API Gateway)
- Follow Go conventions and use `gofmt`
- Use meaningful package and function names
- Include comprehensive error handling
- Write unit tests for all business logic

```bash
# Format code
go fmt ./...

# Run linter
golangci-lint run

# Run tests with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

#### Elixir (Text Channels)
- Follow Elixir style guide
- Use Credo for code analysis
- Write doctests and unit tests
- Use Dialyzer for type checking

```bash
# Format code
mix format

# Run code analysis
mix credo

# Run tests
mix test

# Type checking
mix dialyzer
```

#### C++ (Voice Channels)
- Follow Google C++ Style Guide
- Use clang-format for formatting
- Write unit tests with Google Test
- Use valgrind for memory checking

```bash
# Format code
clang-format -i src/*.cpp include/*.h

# Build with debug info
cmake -DCMAKE_BUILD_TYPE=Debug ..
make

# Run tests
make test

# Memory checking (Linux)
valgrind --leak-check=full ./voice_server
```

## Environment Configuration

### Development Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/driftway
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRATION=24h

# Service URLs
API_GATEWAY_URL=http://localhost:8080
TEXT_SERVICE_URL=http://localhost:4000
VOICE_SERVICE_URL=http://localhost:9090

# Development Settings
DEBUG=true
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Voice Service Settings
STUN_SERVERS=stun:stun.l.google.com:19302
TURN_SERVERS=turn:turnserver.example.com:3478

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60s
```

### Service-Specific Configuration

Each service has its own configuration files:

- **API Gateway**: `api-gateway/config/config.go`
- **Text Channels**: `text-channels/config/config.exs`
- **Voice Channels**: `voice-channels/config.json`

## Database Setup

### MongoDB Setup

1. **Install MongoDB** following the official guide for your OS

2. **Create data directory**:
   ```bash
   mkdir -p ./data/db
   ```

3. **Start MongoDB**:
   ```bash
   mongod --dbpath ./data/db
   ```

4. **Create database and collections**:
   ```bash
   # Connect to MongoDB
   mongosh

   # Create database
   use driftway

   # Create collections
   db.createCollection("users")
   db.createCollection("channels")
   db.createCollection("messages")
   
   # Create indexes
   db.messages.createIndex({ "channel_id": 1, "created_at": -1 })
   db.users.createIndex({ "email": 1 }, { unique: true })
   ```

### Redis Setup

1. **Install Redis** following the official guide for your OS

2. **Start Redis**:
   ```bash
   redis-server
   ```

3. **Test connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

## Testing

### Unit Tests

Each service has its own test suite:

```bash
# API Gateway (Go)
cd api-gateway
go test -v ./...

# Text Channels (Elixir)
cd text-channels
mix test

# Voice Channels (C++)
cd voice-channels
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Debug ..
make
make test
```

### Integration Tests

Run integration tests that test service-to-service communication:

```bash
# Start all services first
docker-compose up -d

# Run integration tests
./scripts/integration-tests.sh
```

### Load Testing

Test the application under load:

```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run tests/load-test.yml
```

## Debugging

### Debug API Gateway (Go)

1. **Use Delve debugger**:
   ```bash
   go install github.com/go-delve/delve/cmd/dlv@latest
   dlv debug main.go
   ```

2. **VS Code debugging**:
   Create `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug API Gateway",
         "type": "go",
         "request": "launch",
         "mode": "debug",
         "program": "./api-gateway/main.go",
         "env": {
           "MONGO_URI": "mongodb://localhost:27017/driftway",
           "REDIS_URL": "redis://localhost:6379"
         }
       }
     ]
   }
   ```

### Debug Text Channels (Elixir)

1. **Use IEx for interactive debugging**:
   ```bash
   cd text-channels
   iex -S mix phx.server
   ```

2. **Add breakpoints in code**:
   ```elixir
   require IEx
   IEx.pry()
   ```

### Debug Voice Channels (C++)

1. **Use GDB**:
   ```bash
   cd voice-channels/build
   gdb ./voice_server
   (gdb) run
   ```

2. **VS Code debugging**:
   Create `.vscode/launch.json` entry:
   ```json
   {
     "name": "Debug Voice Service",
     "type": "cppdbg",
     "request": "launch",
     "program": "${workspaceFolder}/voice-channels/build/voice_server",
     "cwd": "${workspaceFolder}/voice-channels/build"
   }
   ```

## Performance Monitoring

### Application Metrics

Each service exposes metrics endpoints:

- **API Gateway**: `http://localhost:8080/metrics`
- **Text Service**: `http://localhost:4000/metrics`
- **Voice Service**: `http://localhost:9090/metrics`

### Log Analysis

View service logs:

```bash
# Docker logs
docker-compose logs -f api-gateway

# Native logs (varies by service)
tail -f api-gateway/logs/app.log
tail -f text-channels/logs/phoenix.log
tail -f voice-channels/logs/voice.log
```

### Health Checks

Check service health:

```bash
# API Gateway
curl http://localhost:8080/health

# Text Service
curl http://localhost:4000/health

# Voice Service
curl http://localhost:9090/health
```

## Hot Reloading

### Go (API Gateway)
Use Air for hot reloading:

```bash
# Install Air
go install github.com/cosmtrek/air@latest

# Run with hot reload
cd api-gateway
air
```

### Elixir (Phoenix)
Phoenix has built-in hot reloading:

```bash
cd text-channels
mix phx.server
# Code changes automatically reload
```

### C++ (Voice Service)
Use entr for automatic rebuilding:

```bash
# Install entr (Linux/Mac)
# Linux: sudo apt install entr
# Mac: brew install entr

cd voice-channels
find src include -name "*.cpp" -o -name "*.h" | entr -r make -C build
```

## Contributing Guidelines

1. **Follow coding standards** for each language
2. **Write tests** for new functionality
3. **Update documentation** when adding features
4. **Use meaningful commit messages**
5. **Create pull requests** for code review
6. **Ensure CI/CD passes** before merging

## Common Development Tasks

### Add New API Endpoint

1. **Define route** in appropriate service
2. **Implement handler** function
3. **Add input validation**
4. **Write unit tests**
5. **Update API documentation**
6. **Test with integration tests**

### Add New Database Collection

1. **Define model/schema** in service
2. **Create migration** (if applicable)
3. **Add indexes** for performance
4. **Update database documentation**
5. **Write tests** for database operations

### Add New Service

1. **Create service directory** structure
2. **Implement core functionality**
3. **Add Docker configuration**
4. **Update docker-compose.yml**
5. **Add to load balancer** configuration
6. **Write comprehensive tests**
7. **Update documentation**

For more specific development tasks, see the individual service documentation in each service directory.