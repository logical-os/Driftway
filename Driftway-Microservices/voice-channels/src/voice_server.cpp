#include "voice_server.h"
#include "voice_channel.h"
#include "audio_processor.h"
#include "webrtc_handler.h"
#include "database_client.h"
#include "redis_client.h"
#include "http_server.h"

#include <iostream>
#include <stdexcept>
#include <chrono>

namespace driftway {

VoiceServer::VoiceServer(const VoiceServerConfig& config)
    : config_(config), running_(false) {
}

VoiceServer::~VoiceServer() {
    Stop();
}

bool VoiceServer::Start() {
    if (running_.load()) {
        return false;
    }

    try {
        std::cout << "Initializing voice server components..." << std::endl;
        InitializeComponents();

        running_.store(true);

        // Start server thread
        server_thread_ = std::thread(&VoiceServer::ServerLoop, this);
        cleanup_thread_ = std::thread(&VoiceServer::CleanupLoop, this);

        std::cout << "Voice server started successfully!" << std::endl;
        return true;

    } catch (const std::exception& e) {
        std::cerr << "Failed to start voice server: " << e.what() << std::endl;
        running_.store(false);
        return false;
    }
}

void VoiceServer::Stop() {
    if (!running_.load()) {
        return;
    }

    std::cout << "Stopping voice server..." << std::endl;
    running_.store(false);

    // Wait for threads to finish
    if (server_thread_.joinable()) {
        server_thread_.join();
    }
    if (cleanup_thread_.joinable()) {
        cleanup_thread_.join();
    }

    ShutdownComponents();
    std::cout << "Voice server stopped." << std::endl;
}

bool VoiceServer::IsRunning() const {
    return running_.load();
}

std::shared_ptr<VoiceChannel> VoiceServer::CreateChannel(const std::string& channel_id, const std::string& server_id) {
    std::lock_guard<std::mutex> lock(channels_mutex_);
    
    auto it = channels_.find(channel_id);
    if (it != channels_.end()) {
        return it->second; // Channel already exists
    }

    auto channel = std::make_shared<VoiceChannel>(channel_id, server_id);
    channel->SetMaxParticipants(config_.max_participants);
    
    channels_[channel_id] = channel;
    
    std::cout << "Created voice channel: " << channel_id << " for server: " << server_id << std::endl;
    return channel;
}

std::shared_ptr<VoiceChannel> VoiceServer::GetChannel(const std::string& channel_id) {
    std::lock_guard<std::mutex> lock(channels_mutex_);
    
    auto it = channels_.find(channel_id);
    if (it != channels_.end()) {
        return it->second;
    }
    
    return nullptr;
}

bool VoiceServer::RemoveChannel(const std::string& channel_id) {
    std::lock_guard<std::mutex> lock(channels_mutex_);
    
    auto it = channels_.find(channel_id);
    if (it != channels_.end()) {
        std::cout << "Removing voice channel: " << channel_id << std::endl;
        channels_.erase(it);
        return true;
    }
    
    return false;
}

bool VoiceServer::JoinChannel(const std::string& channel_id, const std::string& user_id) {
    auto channel = GetChannel(channel_id);
    if (!channel) {
        return false;
    }

    bool success = channel->AddParticipant(user_id);
    if (success) {
        std::cout << "User " << user_id << " joined voice channel " << channel_id << std::endl;
    }
    
    return success;
}

bool VoiceServer::LeaveChannel(const std::string& channel_id, const std::string& user_id) {
    auto channel = GetChannel(channel_id);
    if (!channel) {
        return false;
    }

    bool success = channel->RemoveParticipant(user_id);
    if (success) {
        std::cout << "User " << user_id << " left voice channel " << channel_id << std::endl;
        
        // Remove empty channels
        if (channel->IsEmpty()) {
            RemoveChannel(channel_id);
        }
    }
    
    return success;
}

std::vector<std::string> VoiceServer::GetChannelParticipants(const std::string& channel_id) {
    auto channel = GetChannel(channel_id);
    if (!channel) {
        return {};
    }

    auto participants = channel->GetParticipants();
    std::vector<std::string> user_ids;
    user_ids.reserve(participants.size());
    
    for (const auto& participant : participants) {
        user_ids.push_back(participant.user_id);
    }
    
    return user_ids;
}

bool VoiceServer::HandleOffer(const std::string& channel_id, const std::string& user_id, const std::string& sdp) {
    // Implementation would involve WebRTC peer connection setup
    std::cout << "Handling WebRTC offer for user " << user_id << " in channel " << channel_id << std::endl;
    
    // For now, just return true to indicate the offer was processed
    // In a real implementation, this would:
    // 1. Create or get existing peer connection for user
    // 2. Set remote description with the SDP offer
    // 3. Generate SDP answer
    // 4. Send answer back to client
    
    return true;
}

bool VoiceServer::HandleAnswer(const std::string& channel_id, const std::string& user_id, const std::string& sdp) {
    std::cout << "Handling WebRTC answer for user " << user_id << " in channel " << channel_id << std::endl;
    
    // Implementation would set the remote description for the peer connection
    return true;
}

bool VoiceServer::HandleIceCandidate(const std::string& channel_id, const std::string& user_id, const std::string& candidate) {
    std::cout << "Handling ICE candidate for user " << user_id << " in channel " << channel_id << std::endl;
    
    // Implementation would add the ICE candidate to the peer connection
    return true;
}

bool VoiceServer::IsHealthy() const {
    if (!running_.load()) {
        return false;
    }

    // Check if key components are healthy
    bool healthy = true;
    
    if (db_client_ && !db_client_->IsConnected()) {
        healthy = false;
    }
    
    if (redis_client_ && !redis_client_->IsConnected()) {
        healthy = false;
    }
    
    return healthy;
}

void VoiceServer::InitializeComponents() {
    // Initialize database client
    std::cout << "Connecting to MongoDB..." << std::endl;
    db_client_ = std::make_unique<DatabaseClient>(config_.mongo_uri);
    
    // Initialize Redis client
    std::cout << "Connecting to Redis..." << std::endl;
    redis_client_ = std::make_unique<RedisClient>(config_.redis_url);
    
    // Initialize HTTP server
    std::cout << "Starting HTTP server..." << std::endl;
    http_server_ = std::make_unique<HttpServer>(config_.http_port, this);
    http_server_->start();
    
    // Initialize audio processor
    std::cout << "Initializing audio processor..." << std::endl;
    audio_processor_ = std::make_unique<AudioProcessor>();
    
    // Initialize WebRTC handler
    std::cout << "Initializing WebRTC handler..." << std::endl;
    webrtc_handler_ = std::make_unique<WebRTCHandler>(config_.rtc_port, this);
}

void VoiceServer::ShutdownComponents() {
    std::cout << "Shutting down components..." << std::endl;
    
    // Clear all channels
    {
        std::lock_guard<std::mutex> lock(channels_mutex_);
        channels_.clear();
    }
    
    // Shutdown components in reverse order
    webrtc_handler_.reset();
    audio_processor_.reset();
    if(http_server_) {
        http_server_->stop();
    }
    http_server_.reset();
    redis_client_.reset();
    db_client_.reset();
}

void VoiceServer::ServerLoop() {
    std::cout << "Voice server main loop started" << std::endl;
    
    while (running_.load()) {
        try {
            // Main server processing loop
            // Handle any background tasks here
            
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            
        } catch (const std::exception& e) {
            std::cerr << "Error in server loop: " << e.what() << std::endl;
        }
    }
    
    std::cout << "Voice server main loop stopped" << std::endl;
}

void VoiceServer::CleanupLoop() {
    std::cout << "Voice server cleanup loop started" << std::endl;
    
    while (running_.load()) {
        try {
            // Cleanup empty channels every 30 seconds
            {
                std::lock_guard<std::mutex> lock(channels_mutex_);
                auto it = channels_.begin();
                while (it != channels_.end()) {
                    if (it->second->IsEmpty()) {
                        std::cout << "Cleaning up empty channel: " << it->first << std::endl;
                        it = channels_.erase(it);
                    } else {
                        ++it;
                    }
                }
            }
            
            std::this_thread::sleep_for(std::chrono::seconds(30));
            
        } catch (const std::exception& e) {
            std::cerr << "Error in cleanup loop: " << e.what() << std::endl;
        }
    }
    
    std::cout << "Voice server cleanup loop stopped" << std::endl;
}

} // namespace driftway