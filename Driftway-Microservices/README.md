# Driftway Microservices Demo

A modern, scalable messaging backend built with multiple programming languages for optimal performance.

## 🚀 Quick Start (Simple Demo)

**Want to try it right now?** Run the simple demo without installing anything:

```powershell
# Run the simple demo server
.\start-demo.ps1
```

This starts a simplified Go server demonstrating the core API functionality at http://localhost:8080

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx LB      │────│  API Gateway    │────│   MongoDB       │
│   (Routing)     │    │     (Go)        │    │  (Database)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                          │
                              │                          │
                    ┌─────────┼─────────┐               │
                    │                   │               │
        ┌─────────────────┐   ┌─────────────────┐      │
        │ Text Channels   │   │ Voice Channels  │      │
        │   (Elixir)      │   │     (C++)       │      │
        └─────────────────┘   └─────────────────┘      │
                    │                   │               │
                    └─────────┬─────────┘               │
                              │                         │
                    ┌─────────────────┐                │
                    │     Redis       │────────────────┘
                    │ (Cache/PubSub)  │
                    └─────────────────┘
```

## Services

### 🌐 API Gateway (Go)
- **Port**: 8080
- **Purpose**: Authentication, rate limiting, request routing
- **Features**: JWT validation, API key management, load balancing

### 💬 Text Channels Service (Elixir/Phoenix)
- **Port**: 4000
- **Purpose**: Real-time text messaging with WebSockets
- **Features**: Message persistence, real-time delivery, presence tracking

### 🎙️ Voice Channels Service (C++)
- **Port**: 9090 (HTTP), 3478 (UDP)
- **Purpose**: Low-latency voice processing and WebRTC
- **Features**: Voice encoding/decoding, real-time audio streaming

### 🗄️ Database Layer
- **MongoDB**: Primary data storage
- **Redis**: Caching and pub/sub messaging

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

```bash
# Clone and navigate
cd Driftway-Microservices

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

### Service URLs
- **API Gateway**: http://localhost:8080
- **Text Channels**: http://localhost:4000
- **Voice Channels**: http://localhost:9090
- **Web Interface**: http://localhost (via Nginx)

## API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

### Text Messaging
```
GET    /api/channels/:id/messages
POST   /api/channels/:id/messages
WS     /api/channels/:id/socket
```

### Voice Channels
```
POST   /api/voice/join/:channelId
DELETE /api/voice/leave/:channelId
GET    /api/voice/participants/:channelId
```

## Development

### Local Development Setup

```bash
# API Gateway (Go)
cd api-gateway
go mod download
go run main.go

# Text Channels (Elixir)
cd text-channels
mix deps.get
mix phx.server

# Voice Channels (C++)
cd voice-channels
mkdir build && cd build
cmake ..
make
./voice_server
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
MONGO_URI=mongodb://localhost:27017/driftway
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret
API_KEY_HASH=your-api-key-hash

# Service URLs
TEXT_SERVICE_URL=http://localhost:4000
VOICE_SERVICE_URL=http://localhost:9090
```

## Service Communication

Services communicate via:
- **HTTP/REST**: API calls between services
- **gRPC**: High-performance inter-service communication
- **Redis Pub/Sub**: Event broadcasting
- **WebSockets**: Real-time client connections

## Monitoring

### Health Checks
```bash
# Check all services
curl http://localhost:8080/health

# Individual services
curl http://localhost:4000/health  # Text service
curl http://localhost:9090/health  # Voice service
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f text-channels
docker-compose logs -f voice-channels
```

## Scaling

### Horizontal Scaling
```bash
# Scale text channels service
docker-compose up -d --scale text-channels=3

# Scale voice channels service
docker-compose up -d --scale voice-channels=2
```

### Load Testing
```bash
# Install testing tools
npm install -g artillery

# Run load tests
artillery run tests/load-test.yml
```

## Security Features

- 🔐 JWT-based authentication
- 🛡️ API key validation
- 🚫 Rate limiting per IP/user
- 🔒 TLS/SSL termination at Nginx
- 🌐 CORS protection
- 📝 Request logging and monitoring

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.