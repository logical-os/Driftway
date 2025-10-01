#include "http_server.h"
#include "voice_server.h"
#include "../third_party/httplib.h"
#include <iostream>
#include <string>
#include <thread>
#include <functional>
#include <chrono>
#include <ctime>

namespace driftway {

HttpServer::HttpServer(int port, VoiceServer* voice_server)
    : port_(port), voice_server_(voice_server), server_(new httplib::Server()) {
    std::cout << "HttpServer created on port " << port << std::endl;
}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::start() {
    setup_routes();
    server_thread_ = std::thread([this]() {
        std::cout << "Starting HTTP server on port " << port_ << std::endl;
        
        server_->set_logger([](const httplib::Request& req, const httplib::Response& res) {
            std::cout << "HTTP " << req.method << " " << req.path << " -> " << res.status << std::endl;
        });
        
        if (!server_->listen("0.0.0.0", port_)) {
            std::cerr << "Error starting HTTP server on port " << port_ << std::endl;
        } else {
            std::cout << "HTTP server started successfully on port " << port_ << std::endl;
        }
    });
    
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
}

void HttpServer::stop() {
    std::cout << "Stopping HTTP server..." << std::endl;
    if (server_ && server_->is_running()) {
        server_->stop();
    }
    if (server_thread_.joinable()) {
        server_thread_.join();
    }
    std::cout << "HTTP server stopped" << std::endl;
}

void HttpServer::setup_routes() {
    server_->Get("/health", [this](const httplib::Request &req, httplib::Response &res) {
        std::cout << "Health check called" << std::endl;
        std::time_t t = std::time(nullptr);
        std::string json = "{\"status\":\"healthy\",\"service\":\"Voice Channels\",\"timestamp\":\"" + std::to_string(t) + "\"}";
        res.status = 200;
        res.set_content(json, "application/json");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        std::cout << "Health check response sent" << std::endl;
    });

    server_->Get("/channels", [this](const httplib::Request &req, httplib::Response &res) {
        std::cout << "Channels endpoint called" << std::endl;
        std::string json = "{\"channels\":[{\"id\":\"1\",\"name\":\"General Voice\",\"participants\":0}]}";
        res.status = 200;
        res.set_content(json, "application/json");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        std::cout << "Channels response sent" << std::endl;
    });
    
    server_->Options("/.*", [](const httplib::Request &, httplib::Response &res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.status = 200;
    });
}

} // namespace driftway
