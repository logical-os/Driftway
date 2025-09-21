# Driftway API Testing Guide

This document provides examples of how to test the Driftway messaging API endpoints.

## Prerequisites

Make sure the server is running:
```bash
npm run dev
```

The server should be accessible at `http://localhost:3000`

## API Endpoints

### Health Check

```bash
# GET /api/health
curl -X GET http://localhost:3000/api/health
```

### Users

#### Get All Users
```bash
# GET /api/users
curl -X GET http://localhost:3000/api/users
```

#### Get User by ID
```bash
# GET /api/users/:id
curl -X GET http://localhost:3000/api/users/USER_ID_HERE
```

#### Create New User
```bash
# POST /api/users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "displayName": "New User"
  }'
```

#### Update User
```bash
# PUT /api/users/:id
curl -X PUT http://localhost:3000/api/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name"
  }'
```

#### Update User Online Status
```bash
# PUT /api/users/:id/status
curl -X PUT http://localhost:3000/api/users/USER_ID_HERE/status \
  -H "Content-Type: application/json" \
  -d '{
    "isOnline": true
  }'
```

### Conversations

#### Get Conversations for User
```bash
# GET /api/conversations?userId=USER_ID
curl -X GET "http://localhost:3000/api/conversations?userId=USER_ID_HERE"
```

#### Get Conversation by ID
```bash
# GET /api/conversations/:id
curl -X GET http://localhost:3000/api/conversations/CONVERSATION_ID_HERE
```

#### Create New Conversation
```bash
# POST /api/conversations
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Group Chat",
    "type": "group",
    "participants": ["USER_ID_1", "USER_ID_2"],
    "createdBy": "USER_ID_1"
  }'
```

### Messages

#### Get Messages for Conversation
```bash
# GET /api/messages?conversationId=CONVERSATION_ID
curl -X GET "http://localhost:3000/api/messages?conversationId=CONVERSATION_ID_HERE"
```

#### Send New Message
```bash
# POST /api/messages
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "CONVERSATION_ID_HERE",
    "content": "Hello, this is a test message!",
    "senderId": "USER_ID_HERE"
  }'
```

#### Mark Message as Read
```bash
# PUT /api/messages/:id/read
curl -X PUT http://localhost:3000/api/messages/MESSAGE_ID_HERE/read \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE"
  }'
```

## WebSocket Testing

### Using Browser Console

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', {
  userId: 'USER_ID_HERE',
  username: 'your_username'
});

// Join a conversation
socket.emit('join-conversation', 'CONVERSATION_ID_HERE');

// Send a message
socket.emit('send-message', {
  conversationId: 'CONVERSATION_ID_HERE',
  content: 'Hello from WebSocket!',
  messageType: 'text'
});

// Listen for incoming messages
socket.on('message-received', (message) => {
  console.log('New message:', message);
});

// Listen for typing indicators
socket.on('user-typing', (data) => {
  console.log('User typing:', data);
});
```

## Sample Workflow

1. **Get all users** to see available sample users
2. **Get conversations for a user** to see existing conversations
3. **Send a message** to one of the conversations
4. **Get messages** to see the sent message
5. **Connect via WebSocket** for real-time features

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Success Responses

All successful responses follow this format:
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```