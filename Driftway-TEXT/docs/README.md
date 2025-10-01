# Chat Service - Elixir Microservice

A horizontally scalable text channel messaging microservice built with Elixir and Phoenix, providing Discord-like chat functionality.

## Features

- **Real-time messaging** via WebSockets
- **Text channels** with message history
- **Horizontal scaling** with clustering support
- **REST API** for channel and message management
- **User authentication** (token-based)
- **Typing indicators** for enhanced UX
- **Health monitoring** endpoint

## Architecture

### Scalability Features
- **Phoenix PubSub**: Distributed message broadcasting across nodes
- **libcluster**: Automatic node discovery and clustering
- **Registry**: Process registry for tracking active channels
- **ETS**: In-memory message storage (replaceable with DB)

### Components
- `ChatServiceWeb.TextChannel`: WebSocket channel for real-time chat
- `ChatService.Channel`: Message and channel management
- `ChatServiceWeb.Endpoint`: HTTP/WebSocket server
- Controllers for REST API endpoints

## Quick Start

### Prerequisites
- Elixir 1.12+
- Erlang/OTP 24+

### Installation

1. **Install dependencies**:
   ```bash
   mix deps.get
   ```

2. **Start the server**:
   ```bash
   mix phx.server
   ```

3. **For clustering, start multiple nodes**:
   ```bash
   # Terminal 1
   iex --name chat1@127.0.0.1 -S mix phx.server
   
   # Terminal 2  
   iex --name chat2@127.0.0.1 -S mix phx.server
   ```

## API Usage

### REST Endpoints

- `GET /api/health` - Health check and node status
- `GET /api/channels` - List available channels
- `POST /api/channels` - Create a new channel
- `GET /api/channels/:id/messages` - Get channel message history

### WebSocket Connection

Connect to `/socket` and join channels:

```javascript
// JavaScript client example
const socket = new Phoenix.Socket("/socket", {
  params: {token: "user_token"}
})

socket.connect()

const channel = socket.channel("text_channel:general", {})
channel.join()
  .receive("ok", resp => console.log("Joined successfully", resp))
  .receive("error", resp => console.log("Unable to join", resp))

// Send message
channel.push("new_message", {content: "Hello world!"})

// Receive messages
channel.on("new_message", payload => {
  console.log("New message:", payload)
})
```

## Clustering

The service automatically discovers and connects to other nodes using the configured strategy:

- **Development**: EPMD-based discovery
- **Production**: Kubernetes DNS-based discovery

Configure clustering in `config/config.exs`:

```elixir
config :libcluster,
  topologies: [
    chat_cluster: [
      strategy: Cluster.Strategy.Epmd,
      config: [
        hosts: [:"chat1@127.0.0.1", :"chat2@127.0.0.1"]
      ]
    ]
  ]
```

## Production Deployment

### Environment Variables
- `SECRET_KEY_BASE`: Phoenix secret key
- `SIGNING_SALT`: Session signing salt  
- `HOST`: Application host
- `PORT`: Application port

### Docker Example

```dockerfile
FROM elixir:1.14-alpine

WORKDIR /app
COPY . .

RUN mix deps.get --only prod
RUN mix compile
RUN mix phx.digest

CMD ["mix", "phx.server"]
```

## Testing

Run the test suite:

```bash
mix test
```

## Monitoring

- Health endpoint: `GET /api/health`
- Returns node status, connected nodes, and uptime

## Production Considerations

### Replace ETS with Database
For production, replace the ETS-based message storage with a proper database:

```elixir
# In ChatService.Channel
def store_message(message) do
  MyApp.Repo.insert(%Message{
    channel_id: message.channel_id,
    user_id: message.user_id,
    content: message.content
  })
end
```

### Authentication
Implement proper JWT or OAuth-based authentication in `ChatServiceWeb.UserSocket.connect/3`.

### Rate Limiting
Add rate limiting to prevent spam:

```elixir
# In TextChannel
def handle_in("new_message", params, socket) do
  case RateLimiter.check_rate(socket.assigns.user_id) do
    :ok -> handle_message(params, socket)
    :rate_limited -> {:reply, {:error, %{reason: "rate_limited"}}, socket}
  end
end
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License