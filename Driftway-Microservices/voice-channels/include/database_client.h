#pragma once

#include <string>
#include <vector>

namespace driftway {

class DatabaseClient {
public:
    DatabaseClient(const std::string& uri);
    ~DatabaseClient();
    
    bool IsConnected() const;
    void disconnect();
    bool createChannel(const std::string& channel_name, int owner_id);
    bool deleteChannel(int channel_id);
    std::vector<int> getChannelParticipants(int channel_id);
    bool addParticipant(int channel_id, int user_id);
    bool removeParticipant(int channel_id, int user_id);
    void logActivity(const std::string& activity);

private:
    std::string connection_uri_;
    bool connected_;
};

} // namespace driftway