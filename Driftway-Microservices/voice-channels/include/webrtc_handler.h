#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace driftway {

class VoiceServer; // Forward declaration

class WebRTCHandler {
public:
    WebRTCHandler(int rtc_port, VoiceServer* voice_server);
    ~WebRTCHandler();
    
    void initialize();
    void shutdown();
    std::string createOffer();
    std::string createAnswer(const std::string& offer);
    void setLocalDescription(const std::string& sdp);
    void setRemoteDescription(const std::string& sdp);
    void addIceCandidate(const std::string& candidate);
    void handleIncomingMedia(const std::vector<uint8_t>& data);
    void sendMedia(const std::vector<uint8_t>& data, const std::string& destination);

private:
    int rtc_port_;
    VoiceServer* voice_server_;
    bool initialized_;
};

} // namespace driftway