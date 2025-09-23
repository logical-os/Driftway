#include <iostream>
#include <vector>
#include <cstdint>

class RTPHandler {
public:
    struct RTPPacket {
        uint32_t timestamp;
        uint16_t sequence;
        uint32_t ssrc;
        std::vector<uint8_t> payload;
    };
    
    static void initialize() {
        std::cout << "RTP Handler initialized" << std::endl;
    }
    
    static RTPPacket createPacket(const std::vector<uint8_t>& audio_data, uint32_t timestamp) {
        RTPPacket packet;
        packet.timestamp = timestamp;
        packet.sequence = ++sequence_number;
        packet.ssrc = 12345; // Mock SSRC
        packet.payload = audio_data;
        
        std::cout << "Created RTP packet: seq=" << packet.sequence << ", timestamp=" << timestamp << std::endl;
        return packet;
    }
    
    static std::vector<uint8_t> parsePacket(const RTPPacket& packet) {
        std::cout << "Parsing RTP packet: seq=" << packet.sequence << std::endl;
        return packet.payload;
    }
    
    static void sendPacket(const RTPPacket& packet, const std::string& destination) {
        std::cout << "Sending RTP packet to " << destination << ", size: " << packet.payload.size() << std::endl;
    }
    
    static void cleanup() {
        std::cout << "RTP Handler cleanup" << std::endl;
    }

private:
    static uint16_t sequence_number;
};

uint16_t RTPHandler::sequence_number = 0;