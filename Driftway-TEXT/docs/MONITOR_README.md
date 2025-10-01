# 🚀 Chat Service Advanced Monitoring System

This repository contains an advanced monitoring system for the Elixir Chat Service microservice, providing beautiful htop-like real-time monitoring with comprehensive metrics, alerts, and clustering information.

## 🎯 Features

### 📊 Real-time Monitoring
- **System Metrics**: CPU, Memory, Disk, Network I/O
- **Application Metrics**: Active connections, channels, messages, response times
- **Cluster Status**: Node information, connectivity, distributed metrics
- **Performance History**: Sparkline graphs and trend analysis

### 🎨 Beautiful Interface
- **htop-inspired Design**: Clean, colorful terminal interface using Rich library
- **Responsive Layout**: Adaptive panels that work on different screen sizes
- **Real-time Updates**: 1-second refresh rate with smooth animations
- **Multiple Views**: Dashboard, logs, alerts, cluster status

### 🚨 Smart Alerting
- **Threshold Monitoring**: Automatic alerts for high CPU, memory, response times
- **Alert History**: Track and resolve system alerts
- **Color-coded Severity**: Visual indicators for different alert levels
- **Real-time Notifications**: Instant alerts for system issues

### 📈 Advanced Analytics
- **Historical Data**: Store up to 5 minutes of metrics history
- **Trend Analysis**: Sparkline charts showing metric trends over time
- **Rate Calculations**: Message rates, error rates, throughput analysis
- **Cluster Health**: Monitor distributed system health across nodes

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- Elixir Chat Service running (default: http://localhost:4000)

### Windows
```cmd
# Double-click or run:
monitor.bat

# Or with custom URL:
monitor.bat --url http://your-service:4000
```

### Linux/macOS
```bash
# Make executable and run:
chmod +x monitor.sh
./monitor.sh

# Or with Python directly:
python3 monitoring.sh --url http://your-service:4000
```

### Advanced Monitoring (Enhanced Features)
```bash
# Run the advanced version with more features:
python3 monitoring_advanced.sh

# With custom settings:
python3 monitoring_advanced.sh --url http://your-service:4000 --refresh 0.5
```

## 🎛️ Interface Overview

### Main Dashboard
```
┌─ 🚀 Chat Service Monitor v2.0 ────────────── 📡 chat1@127.0.0.1 (3 nodes) ── ⏰ 2025-10-01 14:30:15 ─┐
│ 📊 View: Dashboard                           Status: HEALTHY                    ⏱️ Uptime: 2:15:30     │
└─────────────────────────────────────────────────────────────────────────────────── ✅ 0 Alerts ─────┘

┌─ 📊 Live Metrics ──────────────────────┐  ┌─ 🖧 Cluster ───────────────────┐
│ 🖥️  CPU Usage     15.2%  ↘️ green     ██▅▃▂▁▂▃▅██  │  │ 🌐 Cluster Status              │
│ 🧠 Memory         42.1%  → yellow     ▃▄▅▅▆▆▅▄▃▂  │  │ ├─📍 chat1@127.0.0.1 (current) │
│ ⚡ Response       125ms   ↘️ green     ▂▃▄▂▁▂▃▄▅▃  │  │ │  ├─Status: healthy            │
│ 🔗 Connections    47      ↗️ blue      ▁▂▃▄▅▆▇█▆▅  │  │ │  ├─Connections: 47           │
│ 💬 Messages       1,247   📈 green     ▂▃▅▆▇██▇▆▅  │  │ │  └─Channels: 12             │
└─────────────────────────────────────────┘  │ ├─🔗 chat2@127.0.0.1           │
                                              │ └─🔗 chat3@127.0.0.1           │
┌─ 📝 Live Logs ─────────────────────────┐  └─────────────────────────────────┘
│ [14:30:15.123] [INFO] User user_423     │  ┌─ 🚨 Alerts ───────────────────┐
│     connected to channel 'general'      │  │ No alerts                     │
│ [14:30:15.125] [INFO] Message broadcast │  │                               │
│     to 15 users in channel 'tech'      │  │                               │
│ [14:30:15.127] [DEBUG] WebSocket heart  │  │                               │
│     beat from connection 892            │  │                               │
└─────────────────────────────────────────┘  └─────────────────────────────────┘

┌─ Ctrl+C Quit  │  Tab Switch View  │  R Refresh  │  A Clear Alerts  │ Runtime: 2:15:30 │ Refresh: 1s ─┘
```

### Key Metrics Displayed

#### 🖥️ System Performance
- **CPU Usage**: Real-time CPU utilization of BEAM/Elixir processes
- **Memory Usage**: Memory consumption with trend indicators
- **Disk Usage**: Storage utilization monitoring
- **Network I/O**: Bytes sent/received, packet statistics

#### 📡 Application Health  
- **Active Connections**: WebSocket connections count
- **Active Channels**: Number of text channels in use
- **Message Throughput**: Total messages and rate per second
- **Response Times**: API endpoint response latencies

#### 🌐 Cluster Status
- **Node Information**: Current and connected Erlang nodes
- **Cluster Health**: Distributed system connectivity
- **Load Distribution**: Per-node performance metrics
- **Failover Status**: Node availability and redundancy

#### 📈 Performance Analytics
- **Sparkline Graphs**: Mini-charts showing metric trends
- **Historical Data**: Up to 5 minutes of performance history  
- **Trend Indicators**: Up/down arrows showing metric direction
- **Color Coding**: Green/yellow/red status based on thresholds

## ⚙️ Configuration

### Alert Thresholds
You can modify alert thresholds in the monitoring script:

```python
self.alert_thresholds = {
    "cpu_high": 80.0,          # CPU usage percentage
    "memory_high": 85.0,       # Memory usage percentage  
    "response_time_high": 1000.0,  # Response time in ms
    "error_rate_high": 5.0     # Error rate percentage
}
```

### Monitoring Endpoints
The monitor connects to these service endpoints:
- `GET /api/health` - Basic health check and uptime
- `GET /api/metrics` - Detailed system and application metrics

### Refresh Rate
Adjust the refresh rate for different update frequencies:

```bash
# Faster updates (0.5 seconds)
python3 monitoring_advanced.sh --refresh 0.5

# Slower updates (2 seconds) 
python3 monitoring_advanced.sh --refresh 2.0
```

## 🔧 Troubleshooting

### Common Issues

#### "Service Unreachable" Error
- Ensure the Elixir chat service is running on the specified URL
- Check firewall settings and network connectivity
- Verify the service URL format (include http://)

#### Python Dependencies Missing
- The script auto-installs required packages (rich, aiohttp, psutil)
- For manual installation: `pip install rich aiohttp psutil`

#### Permission Errors (Linux/macOS)
```bash
# Make scripts executable
chmod +x monitor.sh
chmod +x monitoring.sh
chmod +x monitoring_advanced.sh
```

#### High CPU Usage from Monitor
- Increase refresh interval: `--refresh 2.0`  
- The monitor itself uses minimal resources (~1-2% CPU)

### Performance Tips

1. **Optimize Refresh Rate**: Balance between real-time updates and system load
2. **Network Latency**: Monitor works best with <100ms network latency to service
3. **Terminal Size**: Larger terminals (120x40+) provide better visualization
4. **Multiple Instances**: Avoid running multiple monitors simultaneously

## 🏗️ Architecture

### Monitoring Components
```
┌─ Python Monitor ─────────────────────────┐
│                                          │
│ ┌─ Metrics Collector ─┐ ┌─ TUI Display ─┐ │
│ │ • HTTP API Client   │ │ • Rich Layout  │ │
│ │ • System Monitor    │ │ • Live Updates │ │
│ │ • Alert Engine      │ │ • Sparklines   │ │
│ └─────────────────────┘ └───────────────┘ │
│                                          │
│ ┌─ Data Storage ──────┐ ┌─ Log Processor ┐ │
│ │ • Metrics History   │ │ • Log Parsing  │ │  
│ │ • Alert Buffer      │ │ • Filtering    │ │
│ │ • Performance Cache │ │ • Highlighting │ │
│ └─────────────────────┘ └───────────────┘ │
└──────────────────────────────────────────┘
           │
           ▼
┌─ Elixir Chat Service ────────────────────┐
│ ┌─ Phoenix Endpoint ──┐ ┌─ Telemetry ───┐ │
│ │ • /api/health       │ │ • System Stats │ │
│ │ • /api/metrics      │ │ • App Metrics  │ │
│ │ • WebSocket Server  │ │ • Node Info    │ │
│ └─────────────────────┘ └───────────────┘ │
└──────────────────────────────────────────┘
```

### Data Flow
1. **Metrics Collection**: Async HTTP requests to service APIs every 1 second
2. **System Monitoring**: Direct system calls via psutil for host metrics  
3. **Data Processing**: Normalize, calculate trends, check thresholds
4. **Alert Generation**: Compare metrics against configurable thresholds
5. **Display Update**: Render beautiful TUI with Rich library components
6. **History Management**: Rolling buffers for metrics, logs, and alerts

## 🤝 Contributing

### Adding New Metrics
1. Extend the `ServiceMetrics` dataclass
2. Add collection logic in `collect_all_metrics()`
3. Update display panels with new visualization
4. Add appropriate alert thresholds

### Custom Visualizations  
1. Create new panel methods (e.g., `create_custom_panel()`)
2. Add to layout in `update_display()`
3. Include in view switching logic
4. Test responsive behavior

### Performance Optimizations
1. Implement metric sampling for high-frequency data
2. Add data compression for historical storage
3. Optimize rendering for large datasets
4. Cache expensive calculations

## 📄 License

MIT License - see LICENSE file for details.

---

**Made with ❤️ for monitoring Elixir microservices**