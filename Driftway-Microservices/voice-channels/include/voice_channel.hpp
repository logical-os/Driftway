#pragma once
#include <vector>
#include <algorithm>

class VoiceChannel {
public:
    VoiceChannel(int channel_id);
    int getId() const;
    void addParticipant(int user_id);
    void removeParticipant(int user_id);
    std::vector<int> getParticipants() const;

private:
    int id;
    std::vector<int> participants;
};