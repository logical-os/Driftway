# Voice Channels Microservice

## Overview

The Voice Channels microservice is a C++ application that provides real-time voice communication for the Driftway platform. It uses WebRTC for media transport and a custom signaling protocol over WebSockets.

## Architecture

The microservice is composed of the following main components:

*   **VoiceServer:** The main class that manages the lifecycle of the microservice, including the creation and destruction of voice channels.
*   **VoiceChannel:** Represents a single voice channel that can have multiple participants. It is responsible for managing participants, handling audio, and so on.
*   **HttpServer:** A simple HTTP server that exposes a health check endpoint.
*   **WebRTCHandler:** Handles the WebRTC signaling and media transport.
*   **DatabaseClient:** A client for interacting with the MongoDB database.
*   **RedisClient:** A client for interacting with the Redis cache.
*   **AudioProcessor:** A component for processing audio, including encoding/decoding and effects.
*   **WebSocketHandler:** Handles the WebSocket connections for signaling.

## API

### HTTP API

*   **GET /health:** Returns the health status of the microservice.

### WebSocket API

The WebSocket API is used for signaling between the client and the server. The following messages are supported:

*   **join:** Joins a voice channel.
*   **leave:** Leaves a voice channel.
*   **offer:** Sends a WebRTC offer to the server.
*   **answer:** Sends a WebRTC answer to the server.
*   **ice-candidate:** Sends an ICE candidate to the server.

## Configuration

The microservice is configured using the following environment variables:

*   **VOICE_HTTP_PORT:** The port for the HTTP server.
*   **VOICE_RTC_PORT:** The port for the WebRTC media transport.
*   **MONGO_URI:** The URI for the MongoDB database.
*   **REDIS_URL:** The URL for the Redis cache.
*   **API_GATEWAY_URL:** The URL for the API gateway.

## Build and Run

The microservice can be built and run using Docker. The `Dockerfile` in the `voice-channels` directory defines the build process. The `docker-compose.yml` file in the root of the project defines the services and their configurations.

To build and run the microservice, you can use the following command:

```
docker-compose up --build voice-channels
```
