# API Documentation

## Overview

The Driftway Microservices API provides endpoints for authentication, text messaging, and voice communication. All endpoints use REST principles and return JSON responses.

## Base URLs

- **API Gateway**: `http://localhost:8080/api`
- **Text Service**: `http://localhost:4000/api`
- **Voice Service**: `http://localhost:9090/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Get JWT Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username"
    }
  }
}
```

## Authentication Endpoints

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "newuser",
      "email": "newuser@example.com"
    }
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Refresh Token

```http
POST /api/auth/refresh
Authorization: Bearer <jwt_token>
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

## Text Messaging Endpoints

### Get Channels

Get all channels the user has access to:

```http
GET /api/text/channels
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "channel_id",
        "name": "General",
        "description": "General discussion",
        "type": "text",
        "created_at": "2025-09-23T14:30:00Z",
        "member_count": 42
      }
    ]
  }
}
```

### Get Channel Messages

```http
GET /api/text/channels/:channelId/messages?limit=50&before=message_id
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit`: Number of messages to retrieve (default: 50, max: 100)
- `before`: Get messages before this message ID (for pagination)
- `after`: Get messages after this message ID

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message_id",
        "content": "Hello, world!",
        "user_id": "user_id",
        "username": "username",
        "channel_id": "channel_id",
        "created_at": "2025-09-23T14:30:00Z",
        "edited_at": null,
        "type": "text"
      }
    ],
    "has_more": false
  }
}
```

### Send Message

```http
POST /api/text/channels/:channelId/messages
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Hello, everyone!",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message_id",
      "content": "Hello, everyone!",
      "user_id": "user_id",
      "username": "username",
      "channel_id": "channel_id",
      "created_at": "2025-09-23T14:30:00Z",
      "type": "text"
    }
  }
}
```

### Edit Message

```http
PUT /api/text/channels/:channelId/messages/:messageId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Updated message content"
}
```

### Delete Message

```http
DELETE /api/text/channels/:channelId/messages/:messageId
Authorization: Bearer <jwt_token>
```

## WebSocket Connections

### Connect to Channel

Connect to a channel for real-time message updates:

```javascript
const socket = new WebSocket('ws://localhost:4000/api/text/channels/:channelId/socket');

// Send authentication
socket.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token_here'
}));

// Listen for messages
socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

**Message Types:**
- `message`: New message in channel
- `message_edit`: Message was edited
- `message_delete`: Message was deleted
- `user_join`: User joined channel
- `user_leave`: User left channel
- `typing`: User is typing

### Send Real-time Message

```javascript
socket.send(JSON.stringify({
  type: 'message',
  content: 'Hello from WebSocket!',
  channel_id: 'channel_id'
}));
```

### Typing Indicators

```javascript
// Start typing
socket.send(JSON.stringify({
  type: 'typing_start',
  channel_id: 'channel_id'
}));

// Stop typing
socket.send(JSON.stringify({
  type: 'typing_stop',
  channel_id: 'channel_id'
}));
```

## Voice Communication Endpoints

### Get Voice Channels

```http
GET /api/voice/channels
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "voice_channel_id",
        "name": "Voice Chat 1",
        "max_participants": 10,
        "current_participants": 3,
        "bitrate": 64000
      }
    ]
  }
}
```

### Join Voice Channel

```http
POST /api/voice/channels/:channelId/join
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "voice_session_id",
    "ice_servers": [
      {
        "urls": "stun:stun.l.google.com:19302"
      }
    ]
  }
}
```

### Leave Voice Channel

```http
DELETE /api/voice/channels/:channelId/leave
Authorization: Bearer <jwt_token>
```

### WebRTC Signaling

#### Send Offer/Answer

```http
POST /api/voice/channels/:channelId/signal
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "offer",
  "sdp": "v=0\r\no=...",
  "target_user_id": "target_user_id"
}
```

#### Send ICE Candidate

```http
POST /api/voice/channels/:channelId/ice
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "candidate": "candidate:1 1 UDP 2130706431 192.168.1.100 54400 typ host",
  "sdp_mid": "0",
  "sdp_mline_index": 0,
  "target_user_id": "target_user_id"
}
```

### Get Voice Channel Participants

```http
GET /api/voice/channels/:channelId/participants
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "user_id": "user_id",
        "username": "username",
        "joined_at": "2025-09-23T14:30:00Z",
        "muted": false,
        "deafened": false
      }
    ]
  }
}
```

## User Management

### Get User Profile

```http
GET /api/users/me
Authorization: Bearer <jwt_token>
```

### Update User Profile

```http
PUT /api/users/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "username": "newusername",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### Get User by ID

```http
GET /api/users/:userId
Authorization: Bearer <jwt_token>
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid or missing JWT token
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limited
- `500`: Internal Server Error

## Rate Limiting

All endpoints are rate-limited:

- **Authentication**: 5 requests per minute
- **Messaging**: 30 messages per minute
- **API calls**: 100 requests per minute
- **WebSocket**: 60 messages per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1695478800
```

## Pagination

List endpoints support pagination:

```http
GET /api/text/channels/123/messages?limit=25&cursor=next_page_token
```

**Parameters:**
- `limit`: Number of items per page (max 100)
- `cursor`: Next page token from previous response

**Response includes pagination info:**
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "pagination": {
      "has_more": true,
      "next_cursor": "next_page_token",
      "total": 1250
    }
  }
}
```

## Webhooks

Configure webhooks to receive real-time events:

### Webhook Events

- `message.created`: New message sent
- `message.updated`: Message edited
- `message.deleted`: Message deleted
- `user.joined`: User joined channel
- `user.left`: User left channel

### Webhook Payload

```json
{
  "event": "message.created",
  "timestamp": "2025-09-23T14:30:00Z",
  "data": {
    "message": {
      "id": "message_id",
      "content": "Hello!",
      "user_id": "user_id",
      "channel_id": "channel_id"
    }
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @driftway/js-sdk
```

```javascript
import { DriftwayClient } from '@driftway/js-sdk';

const client = new DriftwayClient({
  baseUrl: 'http://localhost:8080',
  token: 'jwt_token'
});

// Send message
await client.channels.sendMessage('channel_id', {
  content: 'Hello from SDK!'
});
```

### Python

```bash
pip install driftway-python
```

```python
from driftway import DriftwayClient

client = DriftwayClient(
    base_url='http://localhost:8080',
    token='jwt_token'
)

# Send message
client.channels.send_message('channel_id', {
    'content': 'Hello from Python!'
})
```

## Examples

### Complete Chat Application

See the [examples/](../examples/) directory for complete implementations:

- **React Chat App**: Full-featured web chat application
- **Discord Bot**: Example bot using the API
- **Mobile App**: React Native chat application
- **CLI Client**: Command-line chat client

### Curl Examples

See [examples/curl-examples.md](../examples/curl-examples.md) for complete curl command examples for all endpoints.