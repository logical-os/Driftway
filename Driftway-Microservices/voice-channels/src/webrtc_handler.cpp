#include <iostream>
#include <string>
#include "webrtc_handler.h"

namespace driftway {

WebRTCHandler::WebRTCHandler(int rtc_port, VoiceServer* voice_server) 
    : rtc_port_(rtc_port), voice_server_(voice_server), initialized_(false) {
    std::cout << "WebRTCHandler created on port " << rtc_port << std::endl;
}

WebRTCHandler::~WebRTCHandler() {
    shutdown();
}

void WebRTCHandler::initialize() {
    std::cout << "WebRTC Handler initialized" << std::endl;
    initialized_ = true;
}

void WebRTCHandler::shutdown() {
    if (initialized_) {
        std::cout << "WebRTC Handler shutting down" << std::endl;
        initialized_ = false;
    }
}

std::string WebRTCHandler::createOffer() {
    std::cout << "Creating WebRTC offer" << std::endl;
    return R"({"type":"offer","sdp":"v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"})";
}

std::string WebRTCHandler::createAnswer(const std::string& offer) {
    std::cout << "Creating WebRTC answer for offer" << std::endl;
    return R"({"type":"answer","sdp":"v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"})";
}

void WebRTCHandler::setLocalDescription(const std::string& sdp) {
    std::cout << "Setting local description: " << sdp.substr(0, 50) << "..." << std::endl;
}

void WebRTCHandler::setRemoteDescription(const std::string& sdp) {
    std::cout << "Setting remote description: " << sdp.substr(0, 50) << "..." << std::endl;
}

void WebRTCHandler::addIceCandidate(const std::string& candidate) {
    std::cout << "Adding ICE candidate: " << candidate << std::endl;
}

void WebRTCHandler::handleIncomingMedia(const std::vector<uint8_t>& data) {
    std::cout << "Handling incoming media data of size: " << data.size() << std::endl;
}

void WebRTCHandler::sendMedia(const std::vector<uint8_t>& data, const std::string& destination) {
    std::cout << "Sending media data of size " << data.size() << " to " << destination << std::endl;
}

} // namespace driftway