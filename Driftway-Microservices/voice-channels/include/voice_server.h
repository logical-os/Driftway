#pragma once

#include <string>
#include <memory>
#include <unordered_map>
#include <vector>
#include <mutex>
#include <thread>
#include <atomic>
#include <functional>

namespace driftway {

// Forward declarations
class VoiceChannel;
class AudioProcessor;
class WebRTCHandler;
class DatabaseClient;
class RedisClient;
class HttpServer;

struct VoiceServerConfig {
    std::string mongo_uri;
    std::string redis_url;
    std::string api_gateway_url;
    int http_port = 9090;
    int rtc_port = 3478;
    int max_participants = 50;
    std::string stun_server = "stun:stun.l.google.com:19302";
};

class VoiceServer {
public:
    explicit VoiceServer(const VoiceServerConfig& config);
    ~VoiceServer();

    bool Start();
    void Stop();
    bool IsRunning() const;

    // Channel management
    std::shared_ptr<VoiceChannel> CreateChannel(const std::string& channel_id, const std::string& server_id);
    std::shared_ptr<VoiceChannel> GetChannel(const std::string& channel_id);
    bool RemoveChannel(const std::string& channel_id);

    // User management
    bool JoinChannel(const std::string& channel_id, const std::string& user_id);
    bool LeaveChannel(const std::string& channel_id, const std::string& user_id);
    std::vector<std::string> GetChannelParticipants(const std::string& channel_id);

    // WebRTC signaling
    bool HandleOffer(const std::string& channel_id, const std::string& user_id, const std::string& sdp);
    bool HandleAnswer(const std::string& channel_id, const std::string& user_id, const std::string& sdp);
    bool HandleIceCandidate(const std::string& channel_id, const std::string& user_id, const std::string& candidate);

    // Health check
    bool IsHealthy() const;

private:
    VoiceServerConfig config_;
    std::atomic<bool> running_;
    
    std::unique_ptr<DatabaseClient> db_client_;
    std::unique_ptr<RedisClient> redis_client_;
    std::unique_ptr<HttpServer> http_server_;
    std::unique_ptr<AudioProcessor> audio_processor_;
    std::unique_ptr<WebRTCHandler> webrtc_handler_;

    std::unordered_map<std::string, std::shared_ptr<VoiceChannel>> channels_;
    mutable std::mutex channels_mutex_;

    std::thread server_thread_;
    std::thread cleanup_thread_;

    void ServerLoop();
    void CleanupLoop();
    void InitializeComponents();
    void ShutdownComponents();
};

} // namespace driftway