# Architecture Documentation

## Overview

Driftway is built using a microservices architecture where each service is optimized for its specific domain and performance requirements. The system uses different programming languages chosen for their strengths in specific areas.

## System Architecture

```
                           Internet/Clients
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │     Load Balancer       │
                     │       (Nginx)           │
                     │   - SSL Termination     │
                     │   - Rate Limiting       │
                     │   - Static Files        │
                     └───────────┬─────────────┘
                                 │
                                 ▼
                     ┌─────────────────────────┐
                     │     API Gateway         │
                     │        (Go)             │
                     │   - Authentication      │
                     │   - Request Routing     │
                     │   - Rate Limiting       │
                     │   - API Key Management  │
                     └─────┬──────────────┬────┘
                           │              │
                ┌──────────▼────────────┐ │
                │   Text Channels       │ │
                │     (Elixir)          │ │
                │ - Real-time Messaging │ │
                │ - WebSocket Handling  │ │
                │ - Presence Tracking   │ │
                │ - Message Persistence │ │
                └───────────────────────┘ │
                                          │
                              ┌───────────▼─────────┐
                              │   Voice Channels    │
                              │       (C++)         │
                              │  - WebRTC Signaling │
                              │  - Audio Processing │
                              │  - Low Latency      │
                              │  - Voice Encoding   │
                              └─────────────────────┘
                                         │
                     ┌───────────────────┼───────────────────┐
                     │                   │                   │
                     ▼                   ▼                   ▼
            ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
            │    MongoDB      │ │     Redis       │ │  File Storage   │
            │  - User Data    │ │ - Session Cache │ │ - Media Files   │
            │  - Messages     │ │ - Pub/Sub       │ │ - Logs          │
            │  - Channels     │ │ - Rate Limiting │ │ - Backups       │
            └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Service Breakdown

### Load Balancer (Nginx)

**Purpose**: Entry point for all external traffic, provides SSL termination, rate limiting, and static file serving.

**Responsibilities**:
- SSL/TLS termination and certificate management
- Load balancing across multiple API Gateway instances
- Rate limiting by IP address
- Static file serving (web app, documentation)
- Request logging and basic security headers
- Health check routing

**Technology Choice**: Nginx was chosen for its proven performance, battle-tested reliability, and extensive feature set for load balancing and reverse proxy functionality.

### API Gateway (Go)

**Purpose**: Central authentication and request routing hub that validates all incoming requests and routes them to appropriate services.

**Responsibilities**:
- JWT token validation and refresh
- User authentication and authorization
- Request routing to downstream services
- API key management for external integrations
- Rate limiting per user/API key
- Request/response logging and metrics
- Service discovery and health checking
- CORS handling

**Technology Choice**: Go was selected for its excellent HTTP performance, built-in concurrency, fast startup time, and strong standard library for building web services.

**Key Components**:
```go
// Authentication middleware
func AuthMiddleware() gin.HandlerFunc

// Rate limiting middleware  
func RateLimitMiddleware() gin.HandlerFunc

// Service proxy for routing requests
type ServiceProxy struct {
    textServiceURL  string
    voiceServiceURL string
}
```

### Text Channels Service (Elixir/Phoenix)

**Purpose**: Handles all real-time text messaging functionality with high concurrency and fault tolerance.

**Responsibilities**:
- Real-time WebSocket connections for instant messaging
- Message persistence and history management
- Channel management (creation, permissions, moderation)
- User presence tracking (online/offline status)
- Message search and indexing
- Push notifications for offline users
- Message reactions and threading
- File upload handling for attachments

**Technology Choice**: Elixir/Phoenix was chosen for its unmatched concurrency model (Actor model), built-in fault tolerance, excellent WebSocket support, and ability to handle millions of concurrent connections on a single machine.

**Key Components**:
```elixir
# WebSocket channel for real-time communication
defmodule TextChannelsWeb.ChatChannel

# Message context for business logic
defmodule TextChannels.Messaging

# Presence tracking for online users
defmodule TextChannelsWeb.Presence

# PubSub for message broadcasting
defmodule TextChannels.PubSub
```

**Concurrency Model**:
- Each WebSocket connection runs in its own lightweight process
- Message handling is distributed across available CPU cores
- Fault isolation ensures one crashed connection doesn't affect others
- Built-in supervision trees provide automatic process restart

### Voice Channels Service (C++)

**Purpose**: Provides low-latency voice communication with real-time audio processing and WebRTC signaling.

**Responsibilities**:
- WebRTC signaling server for peer-to-peer connections
- Audio encoding/decoding (Opus codec)
- Voice activity detection (VAD)
- Echo cancellation and noise suppression
- STUN/TURN server for NAT traversal
- Voice channel management and mixing
- Audio quality adaptation based on network conditions
- Recording and playback functionality

**Technology Choice**: C++ was selected for its zero-overhead abstractions, manual memory management for optimal performance, access to low-level audio APIs, and ability to achieve sub-millisecond latency requirements.

**Key Components**:
```cpp
// Main voice server class
class VoiceServer {
    void handleWebRTCSignaling();
    void processAudioStream();
    void manageVoiceChannels();
};

// Audio processing pipeline
class AudioProcessor {
    void encodeAudio();
    void decodeAudio();
    void applyFilters();
};

// WebRTC connection management
class WebRTCManager {
    void handleOffer();
    void handleAnswer();
    void handleICECandidate();
};
```

## Data Layer

### MongoDB

**Purpose**: Primary database for persistent data storage.

**Collections**:
```javascript
// Users collection
{
  _id: ObjectId,
  username: String,
  email: String,
  password_hash: String,
  avatar_url: String,
  created_at: Date,
  last_active: Date,
  preferences: Object
}

// Channels collection
{
  _id: ObjectId,
  name: String,
  type: String, // "text" or "voice"
  description: String,
  created_by: ObjectId,
  created_at: Date,
  members: [ObjectId],
  permissions: Object
}

// Messages collection
{
  _id: ObjectId,
  content: String,
  user_id: ObjectId,
  channel_id: ObjectId,
  created_at: Date,
  edited_at: Date,
  attachments: [Object],
  reactions: [Object]
}
```

**Indexing Strategy**:
- Messages: Compound index on `(channel_id, created_at)` for pagination
- Users: Unique index on `email` for authentication
- Channels: Index on `members` array for membership queries

### Redis

**Purpose**: High-performance caching and pub/sub messaging.

**Use Cases**:
- Session storage for JWT tokens
- Rate limiting counters
- Real-time pub/sub for cross-service communication
- Cache for frequently accessed data
- WebSocket connection tracking

**Data Structures**:
```
# Session storage
session:{user_id} -> {jwt_token, expires_at}

# Rate limiting
ratelimit:{ip}:{endpoint} -> {count, window_start}

# Pub/sub channels
channel:messages:{channel_id} -> message events
channel:presence:{channel_id} -> user presence events

# Cache
cache:user:{user_id} -> user data
cache:channel:{channel_id} -> channel data
```

## Communication Patterns

### Synchronous Communication (HTTP/REST)

Used for:
- Client to API Gateway
- API Gateway to downstream services for CRUD operations
- Administrative operations

Example flow:
```
Client → API Gateway → Text Service → MongoDB
  ↓         ↓            ↓         ↓
Response ← Response ← Response ← Result
```

### Asynchronous Communication (WebSockets)

Used for:
- Real-time messaging
- Presence updates
- Live notifications

Example flow:
```
Client A → WebSocket → Text Service → Redis Pub/Sub → Text Service → WebSocket → Client B
```

### Event-Driven Communication (Pub/Sub)

Used for:
- Cross-service event notification
- Cache invalidation
- Analytics and logging

Example events:
```javascript
// User joins channel
{
  event: "user.joined.channel",
  user_id: "123",
  channel_id: "456",
  timestamp: "2025-09-23T14:30:00Z"
}

// Message sent
{
  event: "message.created",
  message_id: "789",
  channel_id: "456",
  user_id: "123"
}
```

## Security Architecture

### Authentication Flow

```
1. Client sends credentials → API Gateway
2. API Gateway validates → MongoDB
3. API Gateway generates JWT → Client
4. Client includes JWT in requests → API Gateway
5. API Gateway validates JWT → Continue to service
```

### Authorization Layers

1. **Network Level**: Nginx rate limiting and IP filtering
2. **Application Level**: JWT validation in API Gateway
3. **Service Level**: Permission checks in individual services
4. **Data Level**: MongoDB role-based access control

### Security Measures

- **JWT Tokens**: Short-lived access tokens with refresh mechanism
- **Rate Limiting**: Multiple layers (IP, user, endpoint)
- **CORS**: Configured for specific origins
- **Input Validation**: Comprehensive validation in all services
- **SQL Injection Prevention**: Using parameterized queries
- **XSS Prevention**: Content Security Policy headers

## Scalability Design

### Horizontal Scaling

Each service can be scaled independently:

```yaml
# Scale text service for high message volume
docker-compose up -d --scale text-channels=5

# Scale voice service for more concurrent calls
docker-compose up -d --scale voice-channels=3

# Scale API gateway for higher request throughput
docker-compose up -d --scale api-gateway=4
```

### Load Balancing Strategies

- **Round Robin**: Default for stateless operations
- **Sticky Sessions**: For WebSocket connections
- **Least Connections**: For resource-intensive operations

### Caching Strategy

```
L1: Application-level cache (in-memory)
L2: Redis cache (shared)
L3: Database with optimized queries
```

### Database Scaling

- **Read Replicas**: For read-heavy workloads
- **Sharding**: By channel_id for message collections
- **Indexing**: Optimized for common query patterns

## Performance Characteristics

### Latency Requirements

- **API Responses**: < 100ms for 95th percentile
- **WebSocket Messages**: < 50ms end-to-end
- **Voice Packets**: < 20ms processing time
- **Database Queries**: < 10ms for cached data

### Throughput Targets

- **API Gateway**: 10,000 requests/second
- **Text Service**: 50,000 concurrent WebSocket connections
- **Voice Service**: 1,000 concurrent voice streams
- **Database**: 100,000 operations/second

### Resource Usage

- **Memory**: Each Elixir process uses ~2KB
- **CPU**: Go services use minimal CPU for I/O operations
- **Network**: Voice service optimized for minimal bandwidth

## Monitoring and Observability

### Metrics Collection

Each service exposes Prometheus-compatible metrics:

```
# API Gateway metrics
http_requests_total{method="GET", status="200"}
http_request_duration_seconds
jwt_validations_total
rate_limit_hits_total

# Text Service metrics  
websocket_connections_total
messages_processed_total
channel_members_total

# Voice Service metrics
voice_connections_total
audio_packets_processed_total
webrtc_connections_total
```

### Logging Strategy

- **Structured Logging**: JSON format for all services
- **Correlation IDs**: Track requests across services
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Centralized Collection**: ELK stack or similar

### Health Checks

Each service implements comprehensive health checks:

```
GET /health
{
  "status": "healthy",
  "timestamp": "2025-09-23T14:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "memory_usage": "normal",
    "cpu_usage": "normal"
  }
}
```

## Fault Tolerance

### Circuit Breaker Pattern

Implemented in API Gateway for downstream service calls:

```go
type CircuitBreaker struct {
    failureThreshold int
    resetTimeout     time.Duration
    state           State // CLOSED, OPEN, HALF_OPEN
}
```

### Retry Logic

- **Exponential Backoff**: For transient failures
- **Max Retry Limits**: Prevent infinite loops
- **Dead Letter Queues**: For failed messages

### Graceful Degradation

- **Cached Responses**: When services are unavailable
- **Feature Toggles**: Disable non-critical features
- **Read-Only Mode**: When database is under stress

## Development and Deployment

### CI/CD Pipeline

```
1. Code Commit → GitHub
2. Automated Tests → Pass/Fail
3. Docker Build → Push to Registry
4. Staging Deployment → Integration Tests
5. Production Deployment → Health Checks
6. Monitoring → Alerts
```

### Environment Management

- **Development**: Local Docker Compose
- **Staging**: Kubernetes cluster with limited resources
- **Production**: Multi-zone Kubernetes with auto-scaling

### Configuration Management

- **Environment Variables**: For service configuration
- **Config Maps**: For Kubernetes deployments
- **Secrets Management**: For sensitive data (JWT keys, DB passwords)

This architecture provides a solid foundation for a scalable, maintainable, and performant chat application while leveraging the strengths of each programming language and technology choice.