# Quick Start Guide - Test UI

Get up and running with the Driftway Test UI in under 2 minutes!

## Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local server, optional)

## Step 1: Start the Test UI

### Windows
```powershell
cd test-ui
.\start-server.bat
```

### Linux/Mac
```bash
cd test-ui
./start-server.sh
```

### Alternative (any OS)
```bash
cd test-ui
python3 server.py
```

## Step 2: Open in Browser

Navigate to: http://localhost:3000

## Step 3: Test the Services

### 1. Check Service Health
- Look at the service status cards at the top
- Click "Test Health" buttons to verify connections
- Green = healthy, Red = connection issues

### 2. Test Authentication
1. Go to "Authentication" tab
2. Register a new user:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
3. Login with the credentials
4. Verify JWT token appears

### 3. Test Text Messaging
1. Go to "Text Messaging" tab
2. Connect WebSocket (if available)
3. Select a channel (e.g., "general")
4. Send a test message
5. Watch for real-time updates

### 4. Test Voice Channels
1. Go to "Voice Channels" tab
2. View available voice channels
3. Test WebRTC signaling
4. Join a channel (requires login)

### 5. Test API Endpoints
1. Go to "API Testing" tab
2. Try quick tests:
   - Health Check
   - Get Users (requires login)
   - Get Channels (requires login)
3. Or create custom API requests

## Common Issues

### UI Won't Load
- Check if Python is installed: `python3 --version`
- Try a different port: `python3 server.py 3001`
- Open directly: Double-click `index.html`

### Services Show Red
- Make sure the microservices are running
- Check if ports are correct (8080, 4000, 9090)
- Verify Docker containers: `docker-compose ps`

### CORS Errors
- Use the included server script (not direct file access)
- Check browser console for specific errors
- Ensure services have CORS headers enabled

## What You Can Test

✅ **Service Health**: All three microservices  
✅ **Authentication**: Register, login, JWT validation  
✅ **Text Messaging**: Send/receive messages, WebSocket  
✅ **Voice Channels**: Channel management, WebRTC  
✅ **API Endpoints**: Custom requests, response inspection  
✅ **Real-time Updates**: Live status monitoring  

## Next Steps

1. **Start Full Services**: `docker-compose up -d`
2. **Read Documentation**: Check `docs/` folder
3. **Customize**: Modify `test-ui/app.js` for your needs
4. **Deploy**: Add test UI to your deployment

## Support

- Check the logs tab in the UI for debugging
- View browser console for technical errors
- See `test-ui/README.md` for detailed documentation

Happy testing! 🚀