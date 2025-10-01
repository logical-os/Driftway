# Text Channels Microservice

## Overview

The Text Channels microservice is an Elixir application that provides real-time text communication for the Driftway platform. It uses the Phoenix framework for handling HTTP and WebSocket connections.

## Architecture

The microservice is composed of the following main components:

*   **Application:** The main application module that starts the supervision tree.
*   **Router:** Defines the routes for the microservice, including health check, channels, messages, and presence.
*   **Controllers:** Handle the logic for the routes, such as creating and deleting channels and messages.
*   **Messaging:** The business logic for messaging, including functions for managing messages and channels.
*   **Repo:** A module for interacting with the MongoDB database.
*   **PubSub:** A module for real-time messaging between clients.

## API

The microservice exposes the following main API endpoints:

*   **/health:** Returns the health status of the microservice.
*   **/channels:** CRUD operations for channels.
*   **/channels/:channel_id/messages:** CRUD operations for messages.
*   **/messages/:id/reactions:** Add and remove reactions to messages.
*   **/channels/:id/users:** List the users in a channel.

## Configuration

The microservice is configured using the following environment variables:

*   **DATABASE_URL:** The URL for the MongoDB database.
*   **REDIS_URL:** The URL for the Redis cache.
*   **SECRET_KEY_BASE:** The secret key for signing session cookies.
*   **API_GATEWAY_URL:** The URL for the API gateway.

## Build and Run

The microservice can be built and run using Docker. The `Dockerfile` in the `text-channels` directory defines the build process. The `docker-compose.yml` file in the root of the project defines the services and their configurations.

To build and run the microservice, you can use the following command:

```
docker-compose up --build text-channels
```
