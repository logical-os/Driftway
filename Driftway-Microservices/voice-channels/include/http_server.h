#pragma once

#include <string>
#include <functional>

namespace driftway {

class VoiceServer; // Forward declaration

class HttpServer {
public:
    HttpServer(int port, VoiceServer* voice_server);
    ~HttpServer();
    
    void start();
    void stop();
    void addRoute(const std::string& path, const std::string& method, 
                        std::function<std::string(const std::string&)> handler);
    std::string handleRequest(const std::string& path, const std::string& method, 
                                   const std::string& body);

private:
    int port_;
    VoiceServer* voice_server_;
    bool running_;
};

} // namespace driftway