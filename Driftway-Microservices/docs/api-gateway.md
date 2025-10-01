# API Gateway Microservice

## Overview

The API Gateway is a Go application that serves as the single entry point for all clients of the Driftway platform. It provides authentication, authorization, and proxying to the other microservices.

## Architecture

The microservice is composed of the following main components:

*   **main.go:** The main entry point of the application. It initializes the configuration, database connections, services, and the Gin router.
*   **config:** This package defines the configuration for the microservice and loads it from environment variables.
*   **database:** This package provides functions for connecting to MongoDB and Redis.
*   **middleware:** This package provides middleware for CORS, rate limiting, JWT authentication, and API key authentication.
*   **routes:** This package defines the routes for the API gateway, including authentication, proxying, and user/server management.
*   **services:** This package provides the business logic for the API gateway, including authentication and proxying.

## API

The API gateway exposes the following main API endpoints:

*   **/api/auth:** Authentication endpoints, such as `/register`, `/login`, `/refresh`, and `/me`.
*   **/api/text:** Proxies requests to the `text-channels` microservice.
*   **/api/voice:** Proxies requests to the `voice-channels` microservice.
*   **/api/users:** User management endpoints, such as `/profile` and `/friends`.
*   **/api/servers:** Server management endpoints, such as `/`, `/:id`, `/:id/join`, and `/:id/leave`.

## Configuration

The microservice is configured using the following environment variables:

*   **API_PORT:** The port for the API gateway.
*   **NODE_ENV:** The environment, either `development` or `production`.
*   **LOG_LEVEL:** The log level, either `info` or `debug`.
*   **MONGO_URI:** The URI for the MongoDB database.
*   **REDIS_URL:** The URL for the Redis cache.
*   **JWT_SECRET:** The secret for signing JWT tokens.
*   **API_SECRET:** The secret for API key authentication.
*   **API_KEY_HASH:** The hash of the API key.
*   **TEXT_SERVICE_URL:** The URL for the `text-channels` microservice.
*   **VOICE_SERVICE_URL:** The URL for the `voice-channels` microservice.
*   **RATE_LIMIT_REQUESTS:** The number of requests allowed per window.
*   **RATE_LIMIT_WINDOW:** The window size for rate limiting in seconds.

## Build and Run

The microservice can be built and run using Docker. The `Dockerfile` in the `api-gateway` directory defines the build process. The `docker-compose.yml` file in the root of the project defines the services and their configurations.

To build and run the microservice, you can use the following command:

```
docker-compose up --build api-gateway
```
