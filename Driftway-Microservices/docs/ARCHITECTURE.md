# Driftway Microservices Architecture

This document provides an overview of the architecture of the Driftway microservices.

## Overview

The Driftway platform is built using a microservices architecture. The system is composed of the following main microservices:

*   **API Gateway:** The single entry point for all clients. It provides authentication, authorization, and proxying to the other microservices.
*   **Text Channels:** Provides real-time text communication.
*   **Voice Channels:** Provides real-time voice communication.

## Microservices

For more detailed information about each microservice, please refer to the following documents:

*   [API Gateway](./api-gateway.md)
*   [Text Channels](./text-channels.md)
*   [Voice Channels](./voice-channels.md)
