package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"
)

// Simple in-memory storage for demonstration
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

type Channel struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"` // "text" or "voice"
}

type Message struct {
	ID        int       `json:"id"`
	ChannelID int       `json:"channel_id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Simple in-memory storage
var (
	users    = make(map[int]User)
	channels = make(map[int]Channel)
	messages = make(map[int]Message)
	userID   = 1
	channelID = 1
	messageID = 1
	mutex    = sync.RWMutex{}
)

func init() {
	// Add some sample data
	users[1] = User{ID: 1, Username: "admin", Email: "admin@driftway.com"}
	users[2] = User{ID: 2, Username: "user1", Email: "user1@driftway.com"}
	
	channels[1] = Channel{ID: 1, Name: "general", Type: "text"}
	channels[2] = Channel{ID: 2, Name: "voice-lobby", Type: "voice"}
	
	messages[1] = Message{ID: 1, ChannelID: 1, UserID: 1, Content: "Welcome to Driftway!", CreatedAt: time.Now()}
	
	userID = 3
	channelID = 3
	messageID = 2
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func jsonResponse(w http.ResponseWriter, data interface{}, status int) {
	enableCORS(w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, map[string]string{
		"status":  "healthy",
		"service": "Driftway Microservices Demo",
		"time":    time.Now().Format(time.RFC3339),
	}, http.StatusOK)
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		return
	}
	
	mutex.RLock()
	userList := make([]User, 0, len(users))
	for _, user := range users {
		userList = append(userList, user)
	}
	mutex.RUnlock()
	
	jsonResponse(w, userList, http.StatusOK)
}

func channelsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		return
	}
	
	switch r.Method {
	case "GET":
		mutex.RLock()
		channelList := make([]Channel, 0, len(channels))
		for _, channel := range channels {
			channelList = append(channelList, channel)
		}
		mutex.RUnlock()
		jsonResponse(w, channelList, http.StatusOK)
		
	case "POST":
		var channel Channel
		if err := json.NewDecoder(r.Body).Decode(&channel); err != nil {
			jsonResponse(w, map[string]string{"error": "Invalid JSON"}, http.StatusBadRequest)
			return
		}
		
		mutex.Lock()
		channel.ID = channelID
		channelID++
		channels[channel.ID] = channel
		mutex.Unlock()
		
		jsonResponse(w, channel, http.StatusCreated)
	}
}

func messagesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		return
	}
	
	channelIDStr := r.URL.Query().Get("channel_id")
	if channelIDStr == "" {
		jsonResponse(w, map[string]string{"error": "channel_id parameter required"}, http.StatusBadRequest)
		return
	}
	
	channelIDInt, err := strconv.Atoi(channelIDStr)
	if err != nil {
		jsonResponse(w, map[string]string{"error": "Invalid channel_id"}, http.StatusBadRequest)
		return
	}
	
	switch r.Method {
	case "GET":
		mutex.RLock()
		messageList := make([]Message, 0)
		for _, message := range messages {
			if message.ChannelID == channelIDInt {
				messageList = append(messageList, message)
			}
		}
		mutex.RUnlock()
		jsonResponse(w, messageList, http.StatusOK)
		
	case "POST":
		var message Message
		if err := json.NewDecoder(r.Body).Decode(&message); err != nil {
			jsonResponse(w, map[string]string{"error": "Invalid JSON"}, http.StatusBadRequest)
			return
		}
		
		mutex.Lock()
		message.ID = messageID
		message.ChannelID = channelIDInt
		message.CreatedAt = time.Now()
		messageID++
		messages[message.ID] = message
		mutex.Unlock()
		
		jsonResponse(w, message, http.StatusCreated)
	}
}

func voiceHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		return
	}
	
	// Simulate voice channel status
	jsonResponse(w, map[string]interface{}{
		"status": "Voice channels simulated",
		"active_channels": []map[string]interface{}{
			{"id": 2, "name": "voice-lobby", "users": 0},
		},
		"note": "Voice functionality requires WebRTC implementation",
	}, http.StatusOK)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	html := `
<!DOCTYPE html>
<html>
<head>
    <title>Driftway Microservices Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .method { font-weight: bold; color: #28a745; }
        .url { font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
        .description { color: #666; margin-top: 5px; }
        .status { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Driftway Microservices Demo</h1>
        <p class="status">✅ Server is running successfully!</p>
        <p>This is a simplified demonstration of the Driftway microservices architecture running in standalone mode.</p>
        
        <h2>Available API Endpoints:</h2>
        
        <div class="endpoint">
            <div><span class="method">GET</span> <span class="url">/health</span></div>
            <div class="description">Check server health status</div>
        </div>
        
        <div class="endpoint">
            <div><span class="method">GET</span> <span class="url">/api/users</span></div>
            <div class="description">Get list of all users</div>
        </div>
        
        <div class="endpoint">
            <div><span class="method">GET</span> <span class="url">/api/channels</span></div>
            <div class="description">Get list of all channels</div>
        </div>
        
        <div class="endpoint">
            <div><span class="method">POST</span> <span class="url">/api/channels</span></div>
            <div class="description">Create a new channel</div>
        </div>
        
        <div class="endpoint">
            <div><span class="method">GET</span> <span class="url">/api/messages?channel_id=1</span></div>
            <div class="description">Get messages for a specific channel</div>
        </div>
        
        <div class="endpoint">
            <div><span class="method">POST</span> <span class="url">/api/messages?channel_id=1</span></div>
            <div class="description">Send a message to a specific channel</div>
        </div>
        
        <div class="endpoint">
            <div><span class="method">GET</span> <span class="url">/api/voice</span></div>
            <div class="description">Get voice channel status (simulated)</div>
        </div>
        
        <h2>Example Usage:</h2>
        <p>Try these URLs in your browser:</p>
        <ul>
            <li><a href="/health">/health</a></li>
            <li><a href="/api/users">/api/users</a></li>
            <li><a href="/api/channels">/api/channels</a></li>
            <li><a href="/api/messages?channel_id=1">/api/messages?channel_id=1</a></li>
            <li><a href="/api/voice">/api/voice</a></li>
        </ul>
        
        <h2>Next Steps:</h2>
        <p>To run the full microservices architecture:</p>
        <ol>
            <li>Install Go, Elixir, and C++ build tools</li>
            <li>Install Docker Desktop</li>
            <li>Run: <code>docker-compose up -d</code></li>
        </ol>
    </div>
</body>
</html>`
	
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, html)
}

func main() {
	fmt.Println("🚀 Starting Driftway Microservices Demo Server...")
	
	// Routes
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/api/users", usersHandler)
	http.HandleFunc("/api/channels", channelsHandler)
	http.HandleFunc("/api/messages", messagesHandler)
	http.HandleFunc("/api/voice", voiceHandler)
	
	port := "8080"
	fmt.Printf("✅ Server running on http://localhost:%s\n", port)
	fmt.Println("📱 Open your browser to see the demo interface")
	fmt.Println("🔌 API endpoints are available at /api/*")
	
	log.Fatal(http.ListenAndServe(":"+port, nil))
}