#include <iostream>
#include <vector>
#include <algorithm>
#include <memory>
#include <ctime>
#include "voice_channel.h"

namespace driftway {

VoiceChannel::VoiceChannel(const std::string& channel_id, const std::string& server_id)
    : channel_id_(channel_id), server_id_(server_id), max_participants_(50) {
    std::cout << "Created VoiceChannel " << channel_id << " on server " << server_id << std::endl;
}

VoiceChannel::~VoiceChannel() {
    std::cout << "Destroying VoiceChannel " << channel_id_ << std::endl;
}

size_t VoiceChannel::GetParticipantCount() const {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    return participants_.size();
}

bool VoiceChannel::IsEmpty() const {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    return participants_.empty();
}

bool VoiceChannel::AddParticipant(const std::string& user_id, const std::string& username) {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    
    if (participants_.size() >= max_participants_) {
        return false;
    }
    
    if (participants_.find(user_id) != participants_.end()) {
        return false; // Already in channel
    }
    
    auto participant = std::make_shared<Participant>();
    participant->user_id = user_id;
    participant->username = username.empty() ? user_id : username;
    participant->joined_at = static_cast<uint64_t>(std::time(nullptr));
    participant->ssrc = GenerateSSRC();
    
    participants_[user_id] = participant;
    ssrc_to_user_[participant->ssrc] = user_id;
    
    std::cout << "Added participant " << user_id << " to channel " << channel_id_ << std::endl;
    return true;
}

bool VoiceChannel::RemoveParticipant(const std::string& user_id) {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    
    auto it = participants_.find(user_id);
    if (it == participants_.end()) {
        return false;
    }
    
    // Remove from SSRC mapping
    ssrc_to_user_.erase(it->second->ssrc);
    participants_.erase(it);
    
    std::cout << "Removed participant " << user_id << " from channel " << channel_id_ << std::endl;
    return true;
}

bool VoiceChannel::HasParticipant(const std::string& user_id) const {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    return participants_.find(user_id) != participants_.end();
}

std::vector<Participant> VoiceChannel::GetParticipants() const {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    std::vector<Participant> result;
    
    for (const auto& pair : participants_) {
        result.push_back(*pair.second);
    }
    
    return result;
}

std::shared_ptr<Participant> VoiceChannel::GetParticipant(const std::string& user_id) {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    
    auto it = participants_.find(user_id);
    if (it != participants_.end()) {
        return it->second;
    }
    
    return nullptr;
}

void VoiceChannel::SetAudioCallback(AudioCallback callback) {
    std::lock_guard<std::mutex> lock(callback_mutex_);
    audio_callback_ = callback;
}

bool VoiceChannel::SendAudio(const AudioPacket& packet) {
    packets_sent_++;
    bytes_sent_ += packet.data.size();
    
    std::lock_guard<std::mutex> lock(callback_mutex_);
    if (audio_callback_) {
        audio_callback_(packet);
        return true;
    }
    
    return false;
}

void VoiceChannel::BroadcastAudio(const AudioPacket& packet, const std::string& exclude_user) {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    
    for (const auto& pair : participants_) {
        if (pair.first != exclude_user) {
            std::cout << "Broadcasting audio to " << pair.first << std::endl;
        }
    }
    
    packets_sent_++;
    bytes_sent_ += packet.data.size();
}

void VoiceChannel::SetSpeaking(const std::string& user_id, bool speaking) {
    auto participant = GetParticipant(user_id);
    if (participant) {
        participant->is_speaking = speaking;
        std::cout << "Set speaking status for " << user_id << ": " << speaking << std::endl;
    }
}

void VoiceChannel::SetMuted(const std::string& user_id, bool muted) {
    auto participant = GetParticipant(user_id);
    if (participant) {
        participant->is_muted = muted;
        std::cout << "Set muted status for " << user_id << ": " << muted << std::endl;
    }
}

void VoiceChannel::SetDeafened(const std::string& user_id, bool deafened) {
    auto participant = GetParticipant(user_id);
    if (participant) {
        participant->is_deafened = deafened;
        std::cout << "Set deafened status for " << user_id << ": " << deafened << std::endl;
    }
}

uint32_t VoiceChannel::AssignSSRC(const std::string& user_id) {
    auto participant = GetParticipant(user_id);
    if (participant) {
        return participant->ssrc;
    }
    return 0;
}

uint32_t VoiceChannel::GetSSRC(const std::string& user_id) const {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    
    auto it = participants_.find(user_id);
    if (it != participants_.end()) {
        return it->second->ssrc;
    }
    
    return 0;
}

std::string VoiceChannel::GetUserBySSRC(uint32_t ssrc) const {
    std::lock_guard<std::mutex> lock(participants_mutex_);
    
    auto it = ssrc_to_user_.find(ssrc);
    if (it != ssrc_to_user_.end()) {
        return it->second;
    }
    
    return "";
}

void VoiceChannel::SetMaxParticipants(size_t max_participants) {
    max_participants_ = max_participants;
    std::cout << "Set max participants for channel " << channel_id_ << " to " << max_participants << std::endl;
}

VoiceChannel::ChannelStats VoiceChannel::GetStats() const {
    ChannelStats stats;
    
    std::lock_guard<std::mutex> lock(participants_mutex_);
    stats.total_participants = participants_.size();
    
    for (const auto& pair : participants_) {
        if (pair.second->is_speaking) {
            stats.active_speakers++;
        }
    }
    
    stats.total_packets_sent = packets_sent_;
    stats.total_packets_received = packets_received_;
    stats.total_bytes_sent = bytes_sent_;
    stats.total_bytes_received = bytes_received_;
    
    return stats;
}

uint32_t VoiceChannel::GenerateSSRC() {
    return next_ssrc_++;
}

} // namespace driftway