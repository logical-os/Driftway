#pragma once

#include <string>
#include <vector>

namespace driftway {

class RedisClient {
public:
    RedisClient(const std::string& url);
    ~RedisClient();
    
    bool IsConnected() const;
    void disconnect();
    bool publish(const std::string& channel, const std::string& message);
    void subscribe(const std::string& channel);
    void unsubscribe(const std::string& channel);
    std::string get(const std::string& key);
    bool set(const std::string& key, const std::string& value);
    bool del(const std::string& key);
    void handleMessage(const std::string& channel, const std::string& message);

private:
    std::string connection_url_;
    bool connected_;
};

} // namespace driftway