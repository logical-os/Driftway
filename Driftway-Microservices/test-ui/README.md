# Test UI for Driftway Microservices

A comprehensive web-based testing interface for the Driftway microservices backend.

## Features

### 🔐 Authentication Testing
- User registration and login
- JWT token management
- Protected endpoint testing
- Session persistence

### 💬 Text Messaging
- Real-time WebSocket connections
- Channel management
- Message sending and receiving
- Message history

### 🎤 Voice Channels
- Voice channel listing
- WebRTC connection testing
- Audio signaling simulation
- Channel participant management

### 🧪 API Testing
- Custom API endpoint testing
- HTTP method selection (GET, POST, PUT, DELETE)
- Request body editing
- Response inspection
- Quick test shortcuts

### 📊 Service Monitoring
- Real-time service health checks
- Connection status indicators
- Activity logging
- Toast notifications

## Quick Start

### Option 1: Direct File Access
1. Open `index.html` directly in your browser
2. The UI will attempt to connect to services on localhost

### Option 2: HTTP Server
```bash
# Using Python
cd test-ui
python -m http.server 3000

# Using Node.js
npx serve -p 3000

# Using PHP
php -S localhost:3000
```

Then navigate to `http://localhost:3000`

### Option 3: Add to Docker Compose

Add this service to your `docker-compose.yml`:

```yaml
services:
  # ... existing services ...
  
  test-ui:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./test-ui:/usr/share/nginx/html
    depends_on:
      - api-gateway
      - text-channels
      - voice-channels
```

## Service Endpoints

The test UI is configured to connect to:

- **API Gateway**: `http://localhost:8080`
- **Text Channels**: `http://localhost:4000`
- **Voice Channels**: `http://localhost:9090`

Update the URLs in `app.js` if your services run on different ports:

```javascript
// In app.js data() section
apiBaseUrl: 'http://localhost:8080',
textServiceUrl: 'http://localhost:4000',
voiceServiceUrl: 'http://localhost:9090',
```

## Usage Guide

### 1. Service Health Checks
- Click "Test Health" buttons to verify each service is running
- Green indicators show healthy services
- Red indicators show connection issues

### 2. Authentication
1. Go to the "Authentication" tab
2. Register a new user or use existing credentials
3. Login to get a JWT token
4. Test protected endpoints

### 3. Text Messaging
1. Ensure you're logged in
2. Go to "Text Messaging" tab
3. Select or create a channel
4. Send messages and view real-time updates

### 4. Voice Testing
1. Go to "Voice Channels" tab
2. View available voice channels
3. Test WebRTC signaling
4. Join channels (requires authentication)

### 5. API Testing
1. Go to "API Testing" tab
2. Enter custom endpoints
3. Select HTTP methods
4. Send requests and inspect responses
5. Use quick test buttons for common endpoints

### 6. Monitoring
1. Go to "Logs" tab to view all activity
2. Watch toast notifications for real-time updates
3. Monitor service status indicators in the header

## Testing Scenarios

### Basic Connectivity Test
1. Open the test UI
2. Wait for automatic health checks
3. Verify all services show green status

### Authentication Flow
1. Register a new user with unique email
2. Login with the credentials
3. Verify JWT token is displayed
4. Test a protected endpoint

### Messaging Flow
1. Login as a user
2. Connect to WebSocket
3. Select a channel
4. Send several messages
5. Verify messages appear in real-time

### API Exploration
1. Use the API testing tab
2. Test various endpoints:
   - `GET /health`
   - `GET /api/users/me` (requires auth)
   - `GET /api/text/channels` (requires auth)
   - `POST /api/text/channels/{id}/messages` (requires auth)

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure your services have proper CORS headers:

```go
// In Go API Gateway
c.Header("Access-Control-Allow-Origin", "*")
c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
```

### Service Connection Errors
1. Verify services are running on expected ports
2. Check if services are accessible via browser:
   - `http://localhost:8080/health`
   - `http://localhost:4000/health`
   - `http://localhost:9090/health`

### WebSocket Connection Issues
- WebSocket connections may not work with the simple demo server
- Full WebSocket support requires the complete Elixir Phoenix service
- The UI includes fallback to HTTP API for basic testing

### Authentication Problems
1. Check JWT secret consistency across services
2. Verify token format and expiration
3. Ensure services can validate tokens

## Development Notes

### Technologies Used
- **Vue.js 3**: Reactive frontend framework
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icons
- **Vanilla JavaScript**: No build process required

### File Structure
```
test-ui/
├── index.html      # Main HTML file with Vue app
├── app.js          # Vue.js application logic
└── README.md       # This file
```

### Key Features Implementation
- **Real-time Updates**: Simulated WebSocket with fallback to polling
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Comprehensive error logging and user feedback
- **State Management**: Local storage for authentication persistence
- **Activity Logging**: All actions logged for debugging

## API Endpoints Tested

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`

### Text Messaging
- `GET /api/text/channels`
- `GET /api/text/channels/{id}/messages`
- `POST /api/text/channels/{id}/messages`
- `WebSocket /api/text/socket`

### Voice Channels
- `GET /api/voice/channels`
- `POST /api/voice/channels/{id}/join`
- `DELETE /api/voice/channels/{id}/leave`
- `POST /api/voice/channels/{id}/signal`

### Health Checks
- `GET /health` (all services)

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Notes

- This is a **testing interface** - not for production use
- Credentials are stored in localStorage (for testing convenience)
- No input sanitization (testing tool)
- CORS is disabled for testing

## Contributing

To add new features to the test UI:

1. Add new tab configuration in `tabs` array
2. Add corresponding HTML section
3. Implement methods in Vue.js component
4. Add appropriate styling
5. Update this README

## License

This test UI is part of the Driftway microservices project and follows the same license.