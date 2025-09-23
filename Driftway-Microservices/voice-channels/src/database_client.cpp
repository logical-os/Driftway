#include <iostream>
#include <string>

class DatabaseClient {
public:
    static bool connect(const std::string& uri) {
        std::cout << "Connecting to database: " << uri << std::endl;
        return true;
    }
    
    static void disconnect() {
        std::cout << "Disconnecting from database" << std::endl;
    }
    
    static bool insertVoiceSession(int channel_id, int user_id) {
        std::cout << "Inserting voice session: channel=" << channel_id << ", user=" << user_id << std::endl;
        return true;
    }
    
    static bool removeVoiceSession(int channel_id, int user_id) {
        std::cout << "Removing voice session: channel=" << channel_id << ", user=" << user_id << std::endl;
        return true;
    }
    
    static std::vector<int> getChannelParticipants(int channel_id) {
        std::cout << "Getting participants for channel: " << channel_id << std::endl;
        return {1, 2, 3}; // Mock data
    }
};