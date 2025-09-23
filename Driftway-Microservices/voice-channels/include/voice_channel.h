#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include <unordered_map>
#include <atomic>
#include <functional>

namespace driftway {

struct Participant {
    std::string user_id;
    std::string username;
    bool is_speaking = false;
    bool is_muted = false;
    bool is_deafened = false;
    uint64_t joined_at;
    uint32_t ssrc = 0; // RTP Synchronization Source
};

struct AudioPacket {
    std::string user_id;
    std::vector<uint8_t> data;
    uint32_t timestamp;
    uint16_t sequence_number;
    uint32_t ssrc;
    bool is_opus = true;
};

using AudioCallback = std::function<void(const AudioPacket&)>;

class VoiceChannel {
public:
    explicit VoiceChannel(const std::string& channel_id, const std::string& server_id);
    ~VoiceChannel();

    // Channel info
    const std::string& GetChannelId() const { return channel_id_; }
    const std::string& GetServerId() const { return server_id_; }
    size_t GetParticipantCount() const;
    bool IsEmpty() const;

    // Participant management
    bool AddParticipant(const std::string& user_id, const std::string& username = "");
    bool RemoveParticipant(const std::string& user_id);
    bool HasParticipant(const std::string& user_id) const;
    std::vector<Participant> GetParticipants() const;
    std::shared_ptr<Participant> GetParticipant(const std::string& user_id);

    // Audio handling
    void SetAudioCallback(AudioCallback callback);
    bool SendAudio(const AudioPacket& packet);
    void BroadcastAudio(const AudioPacket& packet, const std::string& exclude_user = "");

    // Voice activity
    void SetSpeaking(const std::string& user_id, bool speaking);
    void SetMuted(const std::string& user_id, bool muted);
    void SetDeafened(const std::string& user_id, bool deafened);

    // RTP/SSRC management
    uint32_t AssignSSRC(const std::string& user_id);
    uint32_t GetSSRC(const std::string& user_id) const;
    std::string GetUserBySSRC(uint32_t ssrc) const;

    // Channel settings
    void SetMaxParticipants(size_t max_participants);
    size_t GetMaxParticipants() const { return max_participants_; }

    // Statistics
    struct ChannelStats {
        size_t total_participants = 0;
        size_t active_speakers = 0;
        uint64_t total_packets_sent = 0;
        uint64_t total_packets_received = 0;
        uint64_t total_bytes_sent = 0;
        uint64_t total_bytes_received = 0;
        double average_packet_loss = 0.0;
        double average_jitter = 0.0;
    };

    ChannelStats GetStats() const;

private:
    std::string channel_id_;
    std::string server_id_;
    size_t max_participants_;

    std::unordered_map<std::string, std::shared_ptr<Participant>> participants_;
    std::unordered_map<uint32_t, std::string> ssrc_to_user_;
    mutable std::mutex participants_mutex_;

    AudioCallback audio_callback_;
    std::mutex callback_mutex_;

    // Statistics
    mutable std::atomic<uint64_t> packets_sent_{0};
    mutable std::atomic<uint64_t> packets_received_{0};
    mutable std::atomic<uint64_t> bytes_sent_{0};
    mutable std::atomic<uint64_t> bytes_received_{0};

    // SSRC management
    std::atomic<uint32_t> next_ssrc_{1000};
    uint32_t GenerateSSRC();
};

} // namespace driftway