# 🚀 Elixir Chat Service - Setup Guide

## Prerequisites Installation

### Step 1: Install Elixir and Erlang

#### Option A: Using Chocolatey (Recommended for Windows)
```powershell
# Install Chocolatey if you don't have it
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Elixir (includes Erlang)
choco install elixir
```

#### Option B: Manual Installation
1. Download Erlang from: https://erlang.org/downloads
2. Download Elixir from: https://elixir-lang.org/install.html#windows
3. Install both in order (Erlang first, then Elixir)

#### Option C: Using Scoop
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Elixir
scoop install elixir
```

### Step 2: Verify Installation
```bash
# Check Elixir version
elixir --version

# Check Erlang version
erl -version
```

## Starting the Chat Service

### Quick Start (After Elixir is installed):

1. **Install dependencies:**
   ```bash
   mix deps.get
   ```

2. **Start the development server:**
   ```bash
   mix phx.server
   ```

3. **Or start with interactive shell:**
   ```bash
   iex -S mix phx.server
   ```

### For Clustering (Multiple Nodes):

1. **Start first node:**
   ```bash
   iex --name chat1@127.0.0.1 -S mix phx.server
   ```

2. **Start second node (in another terminal):**
   ```bash
   PORT=4001 iex --name chat2@127.0.0.1 -S mix phx.server
   ```

3. **Start third node (in another terminal):**
   ```bash
   PORT=4002 iex --name chat3@127.0.0.1 -S mix phx.server
   ```

## Service Endpoints

Once running, the service provides:

- **WebSocket**: `ws://localhost:4000/socket`
- **Health Check**: `http://localhost:4000/api/health`
- **Metrics**: `http://localhost:4000/api/metrics`
- **Channels API**: `http://localhost:4000/api/channels`

## Testing the Service

### Test Health Endpoint:
```bash
curl http://localhost:4000/api/health
```

### Test Metrics Endpoint:
```bash
curl http://localhost:4000/api/metrics
```

### Test WebSocket (JavaScript):
```javascript
const socket = new Phoenix.Socket("ws://localhost:4000/socket")
socket.connect()

const channel = socket.channel("text_channel:general", {})
channel.join()
  .receive("ok", resp => console.log("Joined successfully", resp))
  .receive("error", resp => console.log("Unable to join", resp))

// Send a message
channel.push("new_message", {content: "Hello World!"})

// Listen for messages
channel.on("new_message", payload => {
  console.log("New message:", payload)
})
```

## Troubleshooting

### Common Issues:

#### 1. "mix: command not found"
- Elixir is not installed or not in PATH
- Restart terminal after installation
- Check `elixir --version`

#### 2. "Could not compile dependency"
- Run `mix deps.clean --all`
- Then `mix deps.get`
- Then `mix compile`

#### 3. "Port 4000 already in use"
- Kill existing process: `lsof -ti:4000 | xargs kill -9` (Linux/Mac)
- Or change port: `PORT=4001 mix phx.server`

#### 4. "Node name conflict"
- Use different node names: `--name chat_unique@127.0.0.1`
- Or use short names: `--sname chat1`

### Development vs Production:

#### Development Mode:
```bash
MIX_ENV=dev mix phx.server
```

#### Production Mode:
```bash
MIX_ENV=prod mix compile
MIX_ENV=prod mix phx.server
```

## Performance Tips

1. **Increase BEAM VM limits:**
   ```bash
   elixir --erl "+P 1048576" -S mix phx.server
   ```

2. **Enable clustering:**
   - Edit `config/config.exs` to configure libcluster
   - Start nodes with proper naming

3. **Monitor with observer:**
   ```elixir
   # In IEx
   :observer.start()
   ```

## Next Steps

1. Install Elixir using one of the methods above
2. Run `mix deps.get` to install dependencies  
3. Start the server with `mix phx.server`
4. Test endpoints to ensure it's working
5. Run the monitoring system: `python monitoring_advanced.sh`

---

**Need help?** Check the error messages and logs for specific issues.