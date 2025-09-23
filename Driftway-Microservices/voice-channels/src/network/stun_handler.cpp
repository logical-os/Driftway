#include <iostream>
#include <string>
#include <map>
#include <vector>

class STUNHandler {
public:
    struct STUNMessage {
        uint16_t message_type;
        uint16_t message_length;
        uint32_t magic_cookie;
        std::string transaction_id;
        std::map<std::string, std::string> attributes;
    };
    
    static void initialize(int port) {
        std::cout << "STUN Handler initialized on port " << port << std::endl;
        stun_port = port;
    }
    
    static STUNMessage createBindingRequest() {
        STUNMessage msg;
        msg.message_type = 0x0001; // Binding Request
        msg.message_length = 0;
        msg.magic_cookie = 0x2112A442;
        msg.transaction_id = "driftway12345";
        
        std::cout << "Created STUN binding request" << std::endl;
        return msg;
    }
    
    static STUNMessage createBindingResponse(const STUNMessage& request, const std::string& mapped_address) {
        STUNMessage response;
        response.message_type = 0x0101; // Binding Success Response
        response.message_length = 0;
        response.magic_cookie = request.magic_cookie;
        response.transaction_id = request.transaction_id;
        response.attributes["MAPPED-ADDRESS"] = mapped_address;
        
        std::cout << "Created STUN binding response for " << mapped_address << std::endl;
        return response;
    }
    
    static void handleSTUNPacket(const std::vector<uint8_t>& packet, const std::string& sender_address) {
        std::cout << "Handling STUN packet from " << sender_address << ", size: " << packet.size() << std::endl;
        
        // Mock STUN processing
        if (packet.size() >= 20) { // Minimum STUN header size
            std::cout << "Valid STUN packet received" << std::endl;
        }
    }
    
    static void sendSTUNResponse(const STUNMessage& response, const std::string& destination) {
        std::cout << "Sending STUN response to " << destination << std::endl;
    }
    
    static void cleanup() {
        std::cout << "STUN Handler cleanup" << std::endl;
    }

private:
    static int stun_port;
};

int STUNHandler::stun_port = 3478;