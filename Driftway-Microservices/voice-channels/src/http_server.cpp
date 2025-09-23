#include <iostream>
#include <string>
#include <thread>
#include <functional>

class HTTPServer {
public:
    static void start(int port, std::function<void()> callback = nullptr) {
        std::cout << "Starting HTTP server on port " << port << std::endl;
        
        // Simple HTTP server simulation
        running = true;
        server_thread = std::thread([port]() {
            while (running) {
                std::this_thread::sleep_for(std::chrono::seconds(1));
                // Simulate handling requests
            }
        });
        
        if (callback) {
            callback();
        }
    }
    
    static void stop() {
        std::cout << "Stopping HTTP server" << std::endl;
        running = false;
        if (server_thread.joinable()) {
            server_thread.join();
        }
    }
    
    static std::string handleHealthCheck() {
        return R"({"status":"healthy","service":"Voice Channels","timestamp":")" + 
               std::to_string(std::time(nullptr)) + R"("})";
    }
    
    static std::string handleVoiceChannels() {
        return R"({"channels":[{"id":1,"name":"General Voice","participants":0}]})";
    }

private:
    static bool running;
    static std::thread server_thread;
};

bool HTTPServer::running = false;
std::thread HTTPServer::server_thread;