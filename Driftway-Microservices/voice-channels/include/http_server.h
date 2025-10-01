#pragma once

#include <string>
#include <memory>
#include <thread>

// Forward declarations
namespace httplib {
    class Server;
}

namespace driftway {

class VoiceServer; // Forward declaration

class HttpServer {
public:
    HttpServer(int port, VoiceServer* voice_server);
    ~HttpServer();
    
    void start();
    void stop();

private:
    void setup_routes();

    int port_;
    VoiceServer* voice_server_;
    std::unique_ptr<httplib::Server> server_;
    std::thread server_thread_;
};

} // namespace driftway