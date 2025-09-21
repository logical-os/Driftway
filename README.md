# Driftway - TypeScript Node.js Messaging Backend

A real-time messaging service backend built with TypeScript, Express, and Socket.IO, featuring a Discord-like web client.

## Features

- Real-time messaging with WebSocket support
- RESTful API for message and conversation management
- TypeScript for type safety
- Express.js web framework
- Socket.IO for real-time communication
- Discord-like web interface
- In-memory data storage (can be extended to use databases)

## Quick Start

### 🚀 Easy Startup (Recommended)

The easiest way to start Driftway is using the startup scripts that will launch both the API server and web client automatically.

#### Windows:
```bash
# Double-click start.bat, or run in PowerShell:
.\start.ps1

# Or run directly:
node start.js
```

#### Using npm:
```bash
npm run start-all
```

This will:
1. Check and install dependencies automatically
2. Start the API server on port 3000
3. Start the web client on port 4522
4. Open both services simultaneously

### 🌐 Access the Application

Once started, open your browser and go to:
**http://localhost:4522**

- **API Server**: http://localhost:3000
- **Web Client**: http://localhost:4522 (Discord-like interface)

## Manual Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd driftway
   ```

2. Install API dependencies:
   ```bash
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

### Manual Development

Start API server:
```bash
npm run dev
```

Start client server (in a new terminal):
```bash
npm run client
```

### Manual Production

1. Build the API project:
   ```bash
   npm run build
   ```

2. Start the production API server:
   ```bash
   npm start
   ```

3. Start the client server:
   ```bash
   npm run client
   ```

## API Endpoints

### Messages

- `GET /api/messages` - Get all messages
- `POST /api/messages` - Send a new message
- `GET /api/messages/:conversationId` - Get messages for a specific conversation

### Conversations

- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/:id` - Get a specific conversation

### Users

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get a specific user

## WebSocket Events

### Client to Server

- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `send-message` - Send a message to a conversation

### Server to Client

- `message-received` - New message received in a conversation
- `user-joined` - User joined the conversation
- `user-left` - User left the conversation

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # TypeScript interfaces and types
├── routes/          # API route handlers
├── services/        # Business logic and data services
└── server.ts        # Main application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT