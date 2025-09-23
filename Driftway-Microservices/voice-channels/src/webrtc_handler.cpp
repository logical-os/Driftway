#include <iostream>
#include <string>

class WebRTCHandler {
public:
    static void initialize() {
        std::cout << "WebRTC Handler initialized" << std::endl;
    }
    
    static std::string createOffer(int channel_id, int user_id) {
        std::cout << "Creating WebRTC offer for user " << user_id << " in channel " << channel_id << std::endl;
        return R"({"type":"offer","sdp":"v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"})";
    }
    
    static std::string createAnswer(const std::string& offer) {
        std::cout << "Creating WebRTC answer for offer" << std::endl;
        return R"({"type":"answer","sdp":"v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"})";
    }
    
    static void handleIceCandidate(const std::string& candidate) {
        std::cout << "Handling ICE candidate: " << candidate << std::endl;
    }
    
    static void cleanup() {
        std::cout << "WebRTC Handler cleanup" << std::endl;
    }
};