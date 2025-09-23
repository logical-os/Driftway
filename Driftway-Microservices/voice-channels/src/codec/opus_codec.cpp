#include <iostream>
#include <vector>
#include <cstdint>

class OpusCodec {
public:
    static bool initialize() {
        std::cout << "Opus codec initialized" << std::endl;
        return true;
    }
    
    static std::vector<uint8_t> encode(const std::vector<int16_t>& pcm_data) {
        std::cout << "Encoding PCM data of size: " << pcm_data.size() << std::endl;
        
        // Mock encoding - just convert to bytes
        std::vector<uint8_t> encoded;
        encoded.reserve(pcm_data.size() * 2);
        
        for (int16_t sample : pcm_data) {
            encoded.push_back(static_cast<uint8_t>(sample & 0xFF));
            encoded.push_back(static_cast<uint8_t>((sample >> 8) & 0xFF));
        }
        
        return encoded;
    }
    
    static std::vector<int16_t> decode(const std::vector<uint8_t>& opus_data) {
        std::cout << "Decoding Opus data of size: " << opus_data.size() << std::endl;
        
        // Mock decoding - convert bytes back to int16
        std::vector<int16_t> decoded;
        decoded.reserve(opus_data.size() / 2);
        
        for (size_t i = 0; i < opus_data.size() - 1; i += 2) {
            int16_t sample = static_cast<int16_t>(opus_data[i] | (opus_data[i + 1] << 8));
            decoded.push_back(sample);
        }
        
        return decoded;
    }
    
    static void cleanup() {
        std::cout << "Opus codec cleanup" << std::endl;
    }
};