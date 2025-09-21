# 🌊 Driftway Complete Setup Guide

## What You Have Now

✅ **Complete TypeScript Node.js messaging backend**
✅ **Discord-like web client interface** 
✅ **Real-time messaging with WebSocket**
✅ **Automatic startup script**
✅ **Both servers running on specified ports**

## Quick Start Instructions

### 🚀 One-Click Startup

**Method 1: Double-click the batch file**
- Simply double-click `start.bat` on Windows

**Method 2: Run PowerShell script**
```powershell
.\start.ps1
```

**Method 3: Command line**
```bash
node start.js
```

**Method 4: Using npm**
```bash
npm run start-all
```

### 🌐 Access Your Application

Once the startup script runs, you'll see:
```
🎉 Driftway is now running!
============================================================

📡 API Server:    http://localhost:3000
📱 Web Client:    http://localhost:4522

🌐 Open your browser and go to: http://localhost:4522
```

**Main Access Point: http://localhost:4522**

## What the Startup Script Does

1. **Checks Dependencies** - Automatically installs npm packages if needed
2. **Starts API Server** - Launches the backend on port 3000
3. **Starts Web Client** - Launches the Discord-like interface on port 4522
4. **Provides Status Updates** - Color-coded logs for both servers
5. **Graceful Shutdown** - Ctrl+C stops both servers cleanly

## Using the Application

### First Time Setup
1. Open http://localhost:4522 in your browser
2. You'll see a login modal with sample users:
   - Alice Johnson (@alice)
   - Bob Smith (@bob) 
   - Charlie Brown (@charlie)
3. Click on any user to log in, or create a new user

### Features Available
- **Real-time messaging** with instant delivery
- **Multiple conversation types** (Direct messages, Group chats)
- **Online user status** showing who's currently active
- **Typing indicators** when someone is typing
- **Message history** persistence
- **Discord-like interface** with sidebar navigation

### Sample Data
The system comes pre-loaded with:
- 3 sample users (Alice, Bob, Charlie)
- Sample conversations (Group chat + direct messages)
- Ready-to-use messaging functionality

## Technical Architecture

### Backend (Port 3000)
- **TypeScript + Express.js** REST API
- **Socket.IO** for real-time WebSocket communication
- **In-memory storage** for messages and conversations
- **CORS enabled** for cross-origin requests

### Frontend (Port 4522)
- **Static file server** serving the Discord-like client
- **Vanilla JavaScript** with modern ES6+ features
- **Real-time WebSocket** connection to backend
- **Responsive design** with Discord-inspired UI

## File Structure
```
Driftway/
├── src/                    # Backend TypeScript source
├── client/                 # Frontend web client
│   ├── index.html         # Main application HTML
│   ├── css/styles.css     # Discord-like styling
│   ├── js/app.js          # Client-side JavaScript
│   └── server.js          # Static file server
├── start.js               # Main startup script
├── start.bat              # Windows batch file
├── start.ps1              # PowerShell script
└── package.json           # Dependencies and scripts
```

## Development Features

### Hot Reload
- Backend automatically restarts on file changes
- Frontend serves static files (refresh browser for changes)

### Logging
- Color-coded console output for both servers
- Request logging for API calls
- WebSocket event logging

### Error Handling
- Graceful error handling and user feedback
- Automatic reconnection for WebSocket
- Proper HTTP status codes and error messages

## Customization Options

### Changing Ports
Edit the configuration in:
- Backend: `src/config/index.ts` (API_PORT)
- Frontend: `client/server.js` (CLIENT_PORT)
- Startup: `start.js` (update port references)

### Adding Features
- **Database**: Replace in-memory storage with PostgreSQL/MongoDB
- **Authentication**: Add JWT-based user authentication
- **File Upload**: Implement file sharing capabilities
- **Emoji Support**: Add emoji picker and reactions
- **Push Notifications**: Add browser notification support

## Troubleshooting

### Port Already in Use
If you see port errors:
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :4522

# Kill processes if needed
taskkill /PID <process_id> /F
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules
rm -rf client/node_modules
npm install
cd client && npm install
```

### WebSocket Connection Issues
- Check that both servers are running
- Verify firewall isn't blocking ports 3000/4522
- Ensure browser supports WebSocket (all modern browsers do)

## Production Deployment

For production use:
1. **Build the TypeScript**: `npm run build`
2. **Use a process manager**: PM2, Forever, or systemd
3. **Add a reverse proxy**: Nginx or Apache
4. **Use a real database**: PostgreSQL, MongoDB, etc.
5. **Add SSL/TLS**: HTTPS certificates
6. **Environment variables**: Secure configuration

## Support

The application is now fully functional with:
- ✅ Real-time messaging
- ✅ User management
- ✅ Conversation handling
- ✅ Discord-like interface
- ✅ Automatic startup
- ✅ Development-ready setup

**Enjoy your new Discord-like messaging platform! 🎉**