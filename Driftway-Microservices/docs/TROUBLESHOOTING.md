# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Driftway microservices.

## Common Issues and Solutions

### Docker and Container Issues

#### Issue: Docker Compose Build Failures

**Symptoms:**
- Build fails with missing files (go.sum, mix.lock, etc.)
- "file not found" errors during Docker build
- Cache-related build errors

**Solutions:**

1. **Missing go.sum file**:
   ```bash
   cd api-gateway
   go mod download
   go mod tidy
   # This creates go.sum file
   ```

2. **Missing Elixir dependencies**:
   ```bash
   cd text-channels
   mix deps.get
   mix deps.compile
   ```

3. **Clean Docker cache**:
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

4. **Check Docker Desktop is running**:
   ```bash
   docker info
   # Should return Docker system info without errors
   ```

#### Issue: Services Won't Start

**Symptoms:**
- Container exits immediately
- "Connection refused" errors
- Services stuck in "starting" state

**Solutions:**

1. **Check container logs**:
   ```bash
   docker-compose logs api-gateway
   docker-compose logs text-channels
   docker-compose logs voice-channels
   ```

2. **Verify environment variables**:
   ```bash
   docker-compose exec api-gateway env | grep MONGO
   docker-compose exec api-gateway env | grep REDIS
   ```

3. **Check port conflicts**:
   ```bash
   # Windows
   netstat -an | findstr :8080
   
   # Linux/Mac
   lsof -i :8080
   ```

4. **Restart services individually**:
   ```bash
   docker-compose stop api-gateway
   docker-compose up -d api-gateway
   ```

#### Issue: Database Connection Problems

**Symptoms:**
- "Connection refused" to MongoDB/Redis
- Authentication failures
- Timeout errors

**Solutions:**

1. **Check database container status**:
   ```bash
   docker-compose ps mongodb redis
   ```

2. **Test database connectivity**:
   ```bash
   # MongoDB
   docker-compose exec mongodb mongo --eval "db.stats()"
   
   # Redis
   docker-compose exec redis redis-cli ping
   ```

3. **Verify network connectivity**:
   ```bash
   docker-compose exec api-gateway ping mongodb
   docker-compose exec api-gateway ping redis
   ```

4. **Check database logs**:
   ```bash
   docker-compose logs mongodb
   docker-compose logs redis
   ```

### Service-Specific Issues

#### API Gateway (Go) Issues

**Issue: High Memory Usage**

**Symptoms:**
- Go service consuming excessive memory
- Out of memory errors
- Slow response times

**Solutions:**

1. **Check for memory leaks**:
   ```bash
   # Enable pprof endpoint
   curl http://localhost:8080/debug/pprof/heap
   ```

2. **Adjust garbage collection**:
   ```bash
   # Set environment variables
   export GOGC=20  # More aggressive GC
   export GOMEMLIMIT=500MiB  # Memory limit
   ```

3. **Monitor goroutines**:
   ```bash
   curl http://localhost:8080/debug/pprof/goroutine
   ```

**Issue: Authentication Failures**

**Symptoms:**
- JWT validation errors
- "Invalid token" messages
- 401 Unauthorized responses

**Solutions:**

1. **Check JWT secret**:
   ```bash
   docker-compose exec api-gateway env | grep JWT_SECRET
   ```

2. **Verify token format**:
   ```bash
   # Debug JWT token (use jwt.io or similar)
   echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | base64 -d
   ```

3. **Check system time**:
   ```bash
   # Ensure containers have correct time
   docker-compose exec api-gateway date
   ```

#### Text Channels (Elixir) Issues

**Issue: WebSocket Connection Drops**

**Symptoms:**
- Frequent WebSocket disconnections
- "Connection lost" errors in client
- High connection churn

**Solutions:**

1. **Check Phoenix channel logs**:
   ```bash
   docker-compose logs text-channels | grep -i websocket
   ```

2. **Increase timeouts**:
   ```elixir
   # In config/prod.exs
   config :text_channels, TextChannelsWeb.Endpoint,
     websocket: [timeout: 60_000]
   ```

3. **Monitor process count**:
   ```bash
   docker-compose exec text-channels ps aux | wc -l
   ```

4. **Check memory usage**:
   ```bash
   docker stats text-channels
   ```

**Issue: Message Delivery Failures**

**Symptoms:**
- Messages not appearing in channels
- Database write errors
- PubSub failures

**Solutions:**

1. **Check MongoDB connection**:
   ```bash
   docker-compose exec text-channels mongo "$DATABASE_URL" --eval "db.stats()"
   ```

2. **Verify Redis PubSub**:
   ```bash
   docker-compose exec redis redis-cli monitor
   ```

3. **Check Elixir process tree**:
   ```bash
   docker-compose exec text-channels iex -S mix
   # In IEx console:
   # :observer.start()
   ```

#### Voice Channels (C++) Issues

**Issue: Audio Quality Problems**

**Symptoms:**
- Choppy or distorted audio
- High latency
- Audio dropouts

**Solutions:**

1. **Check audio codec settings**:
   ```cpp
   // Verify Opus encoder settings in config
   {
     "opus": {
       "bitrate": 64000,
       "complexity": 10,
       "fec": true
     }
   }
   ```

2. **Monitor CPU usage**:
   ```bash
   docker stats voice-channels
   ```

3. **Check WebRTC connection state**:
   ```bash
   curl http://localhost:9090/debug/webrtc/connections
   ```

4. **Verify network settings**:
   ```bash
   # Check UDP port availability
   netstat -un | grep :3478
   ```

**Issue: Memory Leaks in C++ Service**

**Symptoms:**
- Steadily increasing memory usage
- Eventual crashes or OOM kills
- Performance degradation over time

**Solutions:**

1. **Use memory debugging tools**:
   ```bash
   # Build with debug symbols
   cd voice-channels
   cmake -DCMAKE_BUILD_TYPE=Debug ..
   make
   
   # Run with Valgrind (Linux)
   valgrind --leak-check=full ./voice_server
   ```

2. **Check for proper cleanup**:
   ```cpp
   // Ensure RAII and proper destructors
   class VoiceConnection {
   public:
       ~VoiceConnection() {
           cleanup();
       }
   };
   ```

3. **Monitor with htop**:
   ```bash
   docker-compose exec voice-channels htop
   ```

### Performance Issues

#### Issue: High Latency

**Symptoms:**
- Slow API responses
- Delayed message delivery
- Poor user experience

**Diagnostic Steps:**

1. **Check service response times**:
   ```bash
   # API Gateway
   curl -w "%{time_total}\n" http://localhost:8080/health
   
   # Text Service
   curl -w "%{time_total}\n" http://localhost:4000/health
   
   # Voice Service
   curl -w "%{time_total}\n" http://localhost:9090/health
   ```

2. **Monitor database performance**:
   ```bash
   # MongoDB slow queries
   docker-compose exec mongodb mongo --eval "db.setProfilingLevel(2, {slowms: 100})"
   docker-compose exec mongodb mongo --eval "db.system.profile.find().limit(5).sort({ts: -1})"
   
   # Redis performance
   docker-compose exec redis redis-cli --latency-history
   ```

3. **Check system resources**:
   ```bash
   docker stats
   ```

**Solutions:**

1. **Add database indexes**:
   ```javascript
   // MongoDB indexes
   db.messages.createIndex({"channel_id": 1, "created_at": -1})
   db.users.createIndex({"email": 1}, {unique: true})
   ```

2. **Enable caching**:
   ```yaml
   # Redis caching configuration
   redis:
     image: redis:7-alpine
     command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
   ```

3. **Optimize queries**:
   ```go
   // Use pagination
   messages, err := getMessages(channelID, limit, offset)
   ```

#### Issue: High CPU Usage

**Symptoms:**
- Services consuming 100% CPU
- Slow response times
- Container throttling

**Solutions:**

1. **Profile CPU usage**:
   ```bash
   # Go service profiling
   curl http://localhost:8080/debug/pprof/profile?seconds=30
   ```

2. **Optimize algorithms**:
   ```elixir
   # Use GenServer for state management
   defmodule MessageProcessor do
     use GenServer
     # Process messages asynchronously
   end
   ```

3. **Scale horizontally**:
   ```bash
   docker-compose up -d --scale api-gateway=3
   docker-compose up -d --scale text-channels=3
   ```

### Network and Connectivity Issues

#### Issue: Service Discovery Problems

**Symptoms:**
- Services can't communicate
- "Host not found" errors
- Intermittent connectivity

**Solutions:**

1. **Check Docker network**:
   ```bash
   docker network ls
   docker network inspect driftway-microservices_driftway-network
   ```

2. **Test inter-service connectivity**:
   ```bash
   docker-compose exec api-gateway nslookup text-channels
   docker-compose exec api-gateway curl http://text-channels:4000/health
   ```

3. **Verify service names**:
   ```yaml
   # Ensure service names match in docker-compose.yml
   services:
     text-channels:  # This becomes the hostname
       image: driftway/text-channels
   ```

#### Issue: WebSocket Connection Problems

**Symptoms:**
- WebSocket handshake failures
- Upgrade errors
- CORS issues

**Solutions:**

1. **Check Nginx WebSocket configuration**:
   ```nginx
   location /api/text/socket {
       proxy_pass http://text_channels;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

2. **Verify CORS settings**:
   ```go
   // API Gateway CORS configuration
   c.Header("Access-Control-Allow-Origin", "*")
   c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
   c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
   ```

3. **Debug WebSocket handshake**:
   ```javascript
   // Client-side debugging
   const socket = new WebSocket('ws://localhost:4000/socket');
   socket.onopen = () => console.log('Connected');
   socket.onerror = (error) => console.error('WebSocket error:', error);
   ```

### Security Issues

#### Issue: Authentication Bypassed

**Symptoms:**
- Unauthorized access to protected endpoints
- JWT validation not working
- Security middleware not applied

**Solutions:**

1. **Check middleware order**:
   ```go
   // Ensure auth middleware is applied first
   router.Use(middleware.AuthMiddleware())
   router.Use(middleware.RateLimitMiddleware())
   ```

2. **Verify JWT secret consistency**:
   ```bash
   # All services should use the same JWT secret
   docker-compose exec api-gateway env | grep JWT_SECRET
   docker-compose exec text-channels env | grep SECRET_KEY_BASE
   ```

3. **Test authentication flow**:
   ```bash
   # Login to get token
   TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}' \
     | jq -r '.data.token')
   
   # Use token for authenticated request
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/protected
   ```

### Monitoring and Debugging Tools

#### Enable Debug Logging

1. **Go service debug logging**:
   ```bash
   docker-compose exec api-gateway env LOG_LEVEL=debug
   ```

2. **Elixir service debug logging**:
   ```elixir
   # In config/dev.exs
   config :logger, level: :debug
   ```

3. **C++ service debug logging**:
   ```cpp
   // Enable debug logs in config.json
   {
     "logging": {
       "level": "debug"
     }
   }
   ```

#### Health Check Endpoints

Test all health endpoints:

```bash
# API Gateway
curl http://localhost:8080/health

# Text Channels
curl http://localhost:4000/health

# Voice Channels
curl http://localhost:9090/health

# Load balancer
curl http://localhost/health
```

#### Performance Monitoring

1. **Set up Prometheus metrics**:
   ```bash
   # Add metrics endpoints to docker-compose.yml
   prometheus:
     image: prom/prometheus
     ports:
       - "9090:9090"
     volumes:
       - ./prometheus.yml:/etc/prometheus/prometheus.yml
   ```

2. **Use Grafana for visualization**:
   ```bash
   grafana:
     image: grafana/grafana
     ports:
       - "3000:3000"
     environment:
       - GF_SECURITY_ADMIN_PASSWORD=admin
   ```

### Emergency Procedures

#### Service Recovery

1. **Restart specific service**:
   ```bash
   docker-compose restart api-gateway
   ```

2. **Recreate containers**:
   ```bash
   docker-compose down api-gateway
   docker-compose up -d api-gateway
   ```

3. **Full system restart**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

#### Data Recovery

1. **MongoDB backup**:
   ```bash
   docker-compose exec mongodb mongodump --db driftway --out /backup
   docker cp mongodb_container:/backup ./mongodb-backup
   ```

2. **Redis backup**:
   ```bash
   docker-compose exec redis redis-cli BGSAVE
   docker cp redis_container:/data/dump.rdb ./redis-backup.rdb
   ```

#### Rollback Procedures

1. **Docker image rollback**:
   ```bash
   # Update docker-compose.yml with previous version
   api-gateway:
     image: driftway/api-gateway:v1.2.0  # Previous version
   
   docker-compose up -d api-gateway
   ```

2. **Database rollback**:
   ```bash
   # Restore from backup
   docker-compose exec mongodb mongorestore --db driftway /backup/driftway
   ```

### Getting Help

#### Log Collection

Collect logs for support:

```bash
#!/bin/bash
# collect-logs.sh
mkdir -p debug-logs
docker-compose logs api-gateway > debug-logs/api-gateway.log
docker-compose logs text-channels > debug-logs/text-channels.log
docker-compose logs voice-channels > debug-logs/voice-channels.log
docker-compose logs mongodb > debug-logs/mongodb.log
docker-compose logs redis > debug-logs/redis.log
docker-compose logs nginx > debug-logs/nginx.log
tar -czf driftway-debug-$(date +%Y%m%d-%H%M%S).tar.gz debug-logs/
```

#### System Information

Gather system information:

```bash
#!/bin/bash
# system-info.sh
echo "Docker version:"
docker --version
echo ""

echo "Docker Compose version:"
docker-compose --version
echo ""

echo "System resources:"
docker system df
echo ""

echo "Running containers:"
docker-compose ps
echo ""

echo "Container resource usage:"
docker stats --no-stream
```

#### Support Checklist

Before seeking help, ensure you have:

- [ ] Service logs collected
- [ ] System information gathered
- [ ] Steps to reproduce the issue documented
- [ ] Configuration files reviewed
- [ ] Basic troubleshooting steps attempted
- [ ] Environment details documented

This troubleshooting guide should help you resolve most common issues with the Driftway microservices. For additional help, consult the service-specific documentation or create a GitHub issue with detailed information.