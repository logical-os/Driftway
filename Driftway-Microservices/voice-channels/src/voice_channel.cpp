#include <iostream>
#include "voice_channel.hpp"

class VoiceChannel {
public:
    VoiceChannel(int channel_id) : id(channel_id) {}
    
    int getId() const { return id; }
    
    void addParticipant(int user_id) {
        participants.push_back(user_id);
        std::cout << "Added participant " << user_id << " to channel " << id << std::endl;
    }
    
    void removeParticipant(int user_id) {
        auto it = std::find(participants.begin(), participants.end(), user_id);
        if (it != participants.end()) {
            participants.erase(it);
            std::cout << "Removed participant " << user_id << " from channel " << id << std::endl;
        }
    }
    
    std::vector<int> getParticipants() const {
        return participants;
    }

private:
    int id;
    std::vector<int> participants;
};