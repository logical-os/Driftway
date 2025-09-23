# Configuration Guide

This guide covers all configuration options for the Driftway microservices, including environment variables, configuration files, and deployment-specific settings.

## Environment Variables

### Global Configuration

These environment variables apply to all services:

```bash
# Environment
ENVIRONMENT=development|staging|production
DEBUG=true|false
LOG_LEVEL=debug|info|warn|error

# Domain and URLs
DOMAIN=localhost
API_BASE_URL=http://localhost:8080
WEB_BASE_URL=http://localhost:3000

# Security
CORS_ORIGINS=http://localhost:3000,https://app.driftway.com
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60s
```

### Database Configuration

```bash
# MongoDB
MONGO_URI=mongodb://username:password@host:port/database
MONGO_DATABASE=driftway
MONGO_TIMEOUT=10s
MONGO_MAX_POOL_SIZE=100

# Redis
REDIS_URL=redis://username:password@host:port/database
REDIS_PASSWORD=your-redis-password
REDIS_MAX_IDLE=10
REDIS_MAX_ACTIVE=100
REDIS_TIMEOUT=5s
```

### Security Configuration

```bash
# JWT Configuration
JWT_SECRET=your-very-long-secure-secret-key-here
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d
JWT_ALGORITHM=HS256

# API Keys
API_KEY_ENABLED=true
API_KEY_HEADER=X-API-Key
API_KEY_RATE_LIMIT=1000

# Encryption
ENCRYPTION_KEY=32-byte-hex-encoded-encryption-key
HASH_ROUNDS=12
```

## Service-Specific Configuration

### API Gateway (Go)

#### Environment Variables

```bash
# Server Configuration
PORT=8080
HOST=0.0.0.0
READ_TIMEOUT=30s
WRITE_TIMEOUT=30s
IDLE_TIMEOUT=120s
MAX_HEADER_SIZE=1048576

# Service URLs
TEXT_SERVICE_URL=http://text-channels:4000
VOICE_SERVICE_URL=http://voice-channels:9090

# Authentication
AUTH_ENABLED=true
SESSION_TIMEOUT=30m
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15m

# Proxy Configuration
PROXY_TIMEOUT=30s
PROXY_RETRIES=3
PROXY_RETRY_DELAY=1s

# Health Check
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=5s
```

#### Configuration File

Create `api-gateway/config/config.yaml`:

```yaml
server:
  port: 8080
  host: "0.0.0.0"
  timeouts:
    read: 30s
    write: 30s
    idle: 120s

database:
  mongodb:
    uri: "${MONGO_URI}"
    database: "${MONGO_DATABASE}"
    timeout: 10s
    max_pool_size: 100
  redis:
    url: "${REDIS_URL}"
    timeout: 5s
    max_idle: 10
    max_active: 100

auth:
  jwt:
    secret: "${JWT_SECRET}"
    expiration: 24h
    refresh_expiration: 7d
  session:
    timeout: 30m
    max_attempts: 5
    lockout_duration: 15m

rate_limiting:
  enabled: true
  requests_per_minute: 100
  burst: 10
  cleanup_interval: 1m

services:
  text_channels:
    url: "${TEXT_SERVICE_URL}"
    timeout: 30s
    retries: 3
  voice_channels:
    url: "${VOICE_SERVICE_URL}"
    timeout: 30s
    retries: 3

logging:
  level: info
  format: json
  output: stdout
```

### Text Channels Service (Elixir)

#### Environment Variables

```bash
# Phoenix Configuration
PORT=4000
SECRET_KEY_BASE=your-phoenix-secret-key-base-here
MIX_ENV=prod
PHX_HOST=localhost

# Database
DATABASE_URL=mongodb://localhost:27017/driftway
POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_POOL_SIZE=10

# WebSocket Configuration
WEBSOCKET_TIMEOUT=60000
WEBSOCKET_MAX_CONNECTIONS=50000
WEBSOCKET_CHECK_ORIGIN=true

# Presence
PRESENCE_TIMEOUT=30000
PRESENCE_CLEANUP_INTERVAL=5000

# Message Limits
MAX_MESSAGE_LENGTH=2000
MAX_MESSAGES_PER_MINUTE=30
MESSAGE_HISTORY_LIMIT=100
```

#### Configuration Files

Create `text-channels/config/config.exs`:

```elixir
import Config

# General application configuration
config :text_channels,
  ecto_repos: [TextChannels.Repo]

# Phoenix configuration
config :text_channels, TextChannelsWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [view: TextChannelsWeb.ErrorView, accepts: ~w(json)],
  pubsub_server: TextChannels.PubSub,
  live_view: [signing_salt: "your-signing-salt"]

# Database configuration
config :text_channels, TextChannels.Repo,
  adapter: Mongo.Ecto,
  url: System.get_env("DATABASE_URL") || "mongodb://localhost:27017/driftway",
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

# Redis configuration
config :text_channels, :redis,
  url: System.get_env("REDIS_URL") || "redis://localhost:6379",
  pool_size: String.to_integer(System.get_env("REDIS_POOL_SIZE") || "10")

# WebSocket configuration
config :text_channels, :websocket,
  timeout: String.to_integer(System.get_env("WEBSOCKET_TIMEOUT") || "60000"),
  max_connections: String.to_integer(System.get_env("WEBSOCKET_MAX_CONNECTIONS") || "50000"),
  check_origin: System.get_env("WEBSOCKET_CHECK_ORIGIN") == "true"

# Message configuration
config :text_channels, :messaging,
  max_message_length: String.to_integer(System.get_env("MAX_MESSAGE_LENGTH") || "2000"),
  max_messages_per_minute: String.to_integer(System.get_env("MAX_MESSAGES_PER_MINUTE") || "30"),
  history_limit: String.to_integer(System.get_env("MESSAGE_HISTORY_LIMIT") || "100")

# Logger configuration
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Import environment specific config
import_config "#{config_env()}.exs"
```

Create `text-channels/config/prod.exs`:

```elixir
import Config

# Phoenix production configuration
config :text_channels, TextChannelsWeb.Endpoint,
  http: [port: String.to_integer(System.get_env("PORT") || "4000")],
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
  server: true

# Database configuration for production
config :text_channels, TextChannels.Repo,
  ssl: true,
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "15")

# Logger configuration for production
config :logger,
  level: :info,
  compile_time_purge_matching: [
    [level_lower_than: :info]
  ]

# Runtime configuration
config :text_channels, :runtime,
  check_origin: [
    "https://app.driftway.com",
    "https://driftway.com"
  ]
```

### Voice Channels Service (C++)

#### Environment Variables

```bash
# Server Configuration
PORT=9090
HOST=0.0.0.0
THREADS=4
MAX_CONNECTIONS=1000

# WebRTC Configuration
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_SERVERS=turn:turnserver.example.com:3478
ICE_TIMEOUT=10000
DTLS_TIMEOUT=5000

# Audio Configuration
AUDIO_SAMPLE_RATE=48000
AUDIO_CHANNELS=2
AUDIO_FRAME_SIZE=960
OPUS_BITRATE=64000
OPUS_COMPLEXITY=10

# Database
MONGO_URI=mongodb://localhost:27017/driftway
REDIS_URL=redis://localhost:6379

# Performance
BUFFER_SIZE=8192
WORKER_THREADS=8
MAX_PACKET_SIZE=1500
```

#### Configuration File

Create `voice-channels/config.json`:

```json
{
  "server": {
    "port": 9090,
    "host": "0.0.0.0",
    "threads": 4,
    "max_connections": 1000,
    "ssl": {
      "enabled": false,
      "cert_file": "/etc/ssl/certs/voice.crt",
      "key_file": "/etc/ssl/private/voice.key"
    }
  },
  "webrtc": {
    "stun_servers": [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302"
    ],
    "turn_servers": [
      {
        "urls": "turn:turnserver.example.com:3478",
        "username": "turn_user",
        "credential": "turn_password"
      }
    ],
    "ice_timeout": 10000,
    "dtls_timeout": 5000
  },
  "audio": {
    "sample_rate": 48000,
    "channels": 2,
    "frame_size": 960,
    "opus": {
      "bitrate": 64000,
      "complexity": 10,
      "vbr": true,
      "fec": true
    }
  },
  "database": {
    "mongodb": {
      "uri": "${MONGO_URI}",
      "database": "driftway",
      "collection": "voice_sessions"
    },
    "redis": {
      "url": "${REDIS_URL}",
      "timeout": 5000
    }
  },
  "performance": {
    "buffer_size": 8192,
    "worker_threads": 8,
    "max_packet_size": 1500,
    "queue_size": 1000
  },
  "logging": {
    "level": "info",
    "file": "/var/log/voice-channels/app.log",
    "max_size": "100MB",
    "max_files": 10
  }
}
```

## Load Balancer Configuration (Nginx)

### Main Configuration

Create `nginx/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;

error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=5r/s;

    # Upstream servers
    upstream api_gateway {
        least_conn;
        server api-gateway-1:8080 max_fails=3 fail_timeout=30s;
        server api-gateway-2:8080 max_fails=3 fail_timeout=30s;
        server api-gateway-3:8080 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream text_channels {
        ip_hash; # Sticky sessions for WebSocket
        server text-channels-1:4000 max_fails=3 fail_timeout=30s;
        server text-channels-2:4000 max_fails=3 fail_timeout=30s;
        server text-channels-3:4000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream voice_channels {
        least_conn;
        server voice-channels-1:9090 max_fails=3 fail_timeout=30s;
        server voice-channels-2:9090 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Main server block
    server {
        listen 80;
        listen [::]:80;
        server_name api.driftway.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name api.driftway.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API Gateway routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # WebSocket routes for text channels
        location /api/text/socket {
            limit_req zone=websocket burst=10 nodelay;
            
            proxy_pass http://text_channels;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # Voice channels routes
        location /api/voice/ {
            proxy_pass http://voice_channels;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Static files
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Environment-Specific Configurations

### Development Configuration

Create `.env.development`:

```bash
# Development environment
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug

# Local services
DOMAIN=localhost
API_BASE_URL=http://localhost:8080
WEB_BASE_URL=http://localhost:3000

# Development databases
MONGO_URI=mongodb://localhost:27017/driftway_dev
REDIS_URL=redis://localhost:6379/0

# Relaxed security for development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=development-secret-key
JWT_EXPIRATION=7d

# Development settings
RATE_LIMIT_ENABLED=false
WEBSOCKET_CHECK_ORIGIN=false
SSL_ENABLED=false
```

### Staging Configuration

Create `.env.staging`:

```bash
# Staging environment
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=info

# Staging domain
DOMAIN=staging.driftway.com
API_BASE_URL=https://api-staging.driftway.com
WEB_BASE_URL=https://staging.driftway.com

# Staging databases
MONGO_URI=mongodb://staging-db:27017/driftway_staging
REDIS_URL=redis://staging-redis:6379/0

# Staging security
CORS_ORIGINS=https://staging.driftway.com
JWT_SECRET=staging-secret-key-change-in-production
JWT_EXPIRATION=24h

# Staging settings
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=200
WEBSOCKET_CHECK_ORIGIN=true
SSL_ENABLED=true
```

### Production Configuration

Create `.env.production`:

```bash
# Production environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=warn

# Production domain
DOMAIN=driftway.com
API_BASE_URL=https://api.driftway.com
WEB_BASE_URL=https://app.driftway.com

# Production databases (use secrets management)
MONGO_URI=mongodb://prod-cluster:27017/driftway
REDIS_URL=redis://prod-redis:6379/0

# Production security (use secrets management)
CORS_ORIGINS=https://app.driftway.com,https://driftway.com
JWT_SECRET=${JWT_SECRET_FROM_VAULT}
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Production settings
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60s
WEBSOCKET_CHECK_ORIGIN=true
SSL_ENABLED=true

# Performance tuning
MAX_CONNECTIONS=10000
WORKER_PROCESSES=auto
POOL_SIZE=20
```

## Docker Configuration

### Development Docker Compose

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile.dev
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./api-gateway:/app
    ports:
      - "8080:8080"
    command: ["air", "-c", ".air.toml"]

  text-channels:
    build:
      context: ./text-channels
      dockerfile: Dockerfile.dev
    environment:
      - MIX_ENV=dev
    volumes:
      - ./text-channels:/app
    ports:
      - "4000:4000"
    command: ["mix", "phx.server"]

  voice-channels:
    build:
      context: ./voice-channels
      dockerfile: Dockerfile.dev
    volumes:
      - ./voice-channels:/app
    ports:
      - "9090:9090"
    command: ["./debug/voice_server"]
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    image: driftway/api-gateway:${VERSION}
    restart: unless-stopped
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
    secrets:
      - jwt_secret
      - mongo_password
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  text-channels:
    image: driftway/text-channels:${VERSION}
    restart: unless-stopped
    environment:
      - MIX_ENV=prod
    secrets:
      - phoenix_secret
      - mongo_password
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

secrets:
  jwt_secret:
    external: true
  mongo_password:
    external: true
  phoenix_secret:
    external: true
```

## Kubernetes Configuration

### ConfigMap

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: driftway-config
  namespace: driftway
data:
  # Environment
  ENVIRONMENT: "production"
  DEBUG: "false"
  LOG_LEVEL: "info"
  
  # URLs
  API_BASE_URL: "https://api.driftway.com"
  WEB_BASE_URL: "https://app.driftway.com"
  
  # Database
  MONGO_DATABASE: "driftway"
  REDIS_DATABASE: "0"
  
  # Rate limiting
  RATE_LIMIT_ENABLED: "true"
  RATE_LIMIT_REQUESTS: "100"
  RATE_LIMIT_WINDOW: "60s"
  
  # WebSocket
  WEBSOCKET_CHECK_ORIGIN: "true"
  WEBSOCKET_TIMEOUT: "60000"
  
  # Performance
  POOL_SIZE: "20"
  MAX_CONNECTIONS: "10000"
```

### Secrets

Create secrets using kubectl:

```bash
# Create JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=$(openssl rand -base64 32) \
  -n driftway

# Create database passwords
kubectl create secret generic database-secrets \
  --from-literal=mongo-password=$(openssl rand -base64 32) \
  --from-literal=redis-password=$(openssl rand -base64 32) \
  -n driftway

# Create Phoenix secret
kubectl create secret generic phoenix-secret \
  --from-literal=secret-key-base=$(mix phx.gen.secret) \
  -n driftway
```

## Configuration Validation

### Environment Validation Script

Create `scripts/validate-config.sh`:

```bash
#!/bin/bash

# validate-config.sh - Validate configuration before deployment

echo "Validating Driftway configuration..."

# Required environment variables
REQUIRED_VARS=(
    "MONGO_URI"
    "REDIS_URL" 
    "JWT_SECRET"
    "ENVIRONMENT"
)

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "ERROR: Required environment variable $var is not set"
        exit 1
    fi
done

# Validate MongoDB connection
if ! mongo "$MONGO_URI" --eval "db.stats()" >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to MongoDB at $MONGO_URI"
    exit 1
fi

# Validate Redis connection
if ! redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to Redis at $REDIS_URL"
    exit 1
fi

# Validate JWT secret strength
if [[ ${#JWT_SECRET} -lt 32 ]]; then
    echo "ERROR: JWT_SECRET must be at least 32 characters long"
    exit 1
fi

# Validate environment values
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "ERROR: ENVIRONMENT must be one of: development, staging, production"
    exit 1
fi

echo "✅ Configuration validation passed!"
```

## Configuration Best Practices

### Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment-specific configuration files**
3. **Rotate secrets regularly**
4. **Use strong passwords and keys**
5. **Enable SSL/TLS in production**

### Performance Best Practices

1. **Tune database connection pools**
2. **Configure appropriate timeouts**
3. **Enable compression**
4. **Use CDN for static assets**
5. **Monitor and adjust resource limits**

### Monitoring Configuration

1. **Enable structured logging**
2. **Configure health checks**
3. **Set up metrics collection**
4. **Configure alerting thresholds**
5. **Enable distributed tracing**

This configuration guide provides comprehensive coverage of all configuration options for the Driftway microservices, ensuring proper setup across different environments and deployment scenarios.