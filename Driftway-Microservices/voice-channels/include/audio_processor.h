#pragma once

#include <vector>
#include <string>
#include <cstdint>

namespace driftway {

class AudioProcessor {
public:
    AudioProcessor();
    ~AudioProcessor();
    
    void processAudioFrame(const std::vector<uint8_t>& frame);
    std::vector<uint8_t> encodeOpus(const std::vector<float>& audio_data);
    std::vector<float> decodeOpus(const std::vector<uint8_t>& encoded_data);
    void applyEchoCancellation(std::vector<float>& audio_data);
    void applyNoiseReduction(std::vector<float>& audio_data);
    void applyVolumeControl(std::vector<float>& audio_data, float volume_level);
};

} // namespace driftway