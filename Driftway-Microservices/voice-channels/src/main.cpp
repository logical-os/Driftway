#include "voice_server.h"
#include <iostream>
#include <csignal>
#include <cstdlib>
#include <thread>
#include <chrono>

using namespace driftway;

// Global server instance for signal handling
VoiceServer* g_server = nullptr;

void SignalHandler(int signal) {
    std::cout << "\nReceived signal " << signal << ", shutting down gracefully..." << std::endl;
    if (g_server) {
        g_server->Stop();
    }
    exit(0);
}

int main(int argc, char* argv[]) {
    std::cout << "Driftway Voice Channels Service v1.0.0" << std::endl;
    std::cout << "========================================" << std::endl;

    // Setup signal handlers
    signal(SIGINT, SignalHandler);
    signal(SIGTERM, SignalHandler);

    // Load configuration from environment variables
    VoiceServerConfig config;
    
    if (const char* mongo_uri = std::getenv("MONGO_URI")) {
        config.mongo_uri = mongo_uri;
    } else {
        config.mongo_uri = "mongodb://localhost:27017/driftway";
    }

    if (const char* redis_url = std::getenv("REDIS_URL")) {
        config.redis_url = redis_url;
    } else {
        config.redis_url = "redis://localhost:6379";
    }

    if (const char* api_gateway_url = std::getenv("API_GATEWAY_URL")) {
        config.api_gateway_url = api_gateway_url;
    } else {
        config.api_gateway_url = "http://localhost:8080";
    }

    if (const char* http_port = std::getenv("VOICE_HTTP_PORT")) {
        config.http_port = std::atoi(http_port);
    }

    if (const char* rtc_port = std::getenv("VOICE_RTC_PORT")) {
        config.rtc_port = std::atoi(rtc_port);
    }

    if (const char* max_participants = std::getenv("VOICE_MAX_PARTICIPANTS")) {
        config.max_participants = std::atoi(max_participants);
    }

    // Print configuration
    std::cout << "Configuration:" << std::endl;
    std::cout << "  MongoDB URI: " << config.mongo_uri << std::endl;
    std::cout << "  Redis URL: " << config.redis_url << std::endl;
    std::cout << "  API Gateway: " << config.api_gateway_url << std::endl;
    std::cout << "  HTTP Port: " << config.http_port << std::endl;
    std::cout << "  RTC Port: " << config.rtc_port << std::endl;
    std::cout << "  Max Participants: " << config.max_participants << std::endl;
    std::cout << std::endl;

    // Create and start server
    try {
        VoiceServer server(config);
        g_server = &server;

        std::cout << "Starting Driftway Voice Server..." << std::endl;
        
        if (!server.Start()) {
            std::cerr << "Failed to start voice server!" << std::endl;
            return 1;
        }

        std::cout << "Voice server started successfully!" << std::endl;
        std::cout << "Listening on:" << std::endl;
        std::cout << "  HTTP: http://localhost:" << config.http_port << std::endl;
        std::cout << "  WebRTC: udp://localhost:" << config.rtc_port << std::endl;
        std::cout << "  Health: http://localhost:" << config.http_port << "/health" << std::endl;
        std::cout << std::endl;
        std::cout << "Press Ctrl+C to stop the server..." << std::endl;

        // Keep the main thread alive
        while (server.IsRunning()) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }

        std::cout << "Server stopped." << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}