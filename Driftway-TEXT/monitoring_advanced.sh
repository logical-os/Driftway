#!/usr/bin/env python3
"""
Advanced Chat Service Monitor v2.0 - Enhanced htop-like interface
Features: Real-time metrics, log analysis, alerting, historical data, clustering inf
"""

import asyncio
import json
import time
import sys
import os
import subprocess
import signal
import re
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from collections import deque, defaultdict
import math

try:
    import psutil
    import aiohttp
    from rich.console import Console
    from rich.live import Live
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    from rich.align import Align
    from rich.columns import Columns
    from rich.tree import Tree
    from rich.progress import Progress, BarColumn
    from rich import box
    from rich.status import Status
    import keyboard
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "rich", "aiohttp", "psutil", "keyboard"])
    # Re-import after installation
    import psutil
    import aiohttp
    from rich.console import Console
    from rich.live import Live
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    from rich.align import Align
    from rich.columns import Columns
    from rich.tree import Tree
    from rich.progress import Progress, BarColumn
    from rich import box
    from rich.status import Status
    import keyboard

@dataclass
class Alert:
    """System alert/notification"""
    timestamp: datetime
    level: str  # INFO, WARN, ERROR, CRITICAL
    message: str
    source: str
    resolved: bool = False

@dataclass
class ServiceMetrics:
    """Enhanced service metrics"""
    # Basic metrics
    node_name: str = "unknown"
    connected_nodes: List[str] = field(default_factory=list)
    uptime: int = 0
    status: str = "unknown"
    
    # Performance metrics
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    memory_total: int = 0
    memory_allocated: int = 0
    process_count: int = 0
    
    # Application metrics
    active_connections: int = 0
    active_channels: int = 0
    total_messages: int = 0
    message_rate: float = 0.0
    
    # Network metrics
    response_time: float = 0.0
    error_rate: float = 0.0
    
    # System metrics
    disk_usage: float = 0.0
    network_io: Dict[str, int] = field(default_factory=dict)

class AdvancedMonitor:
    """Advanced monitoring system with enhanced features"""
    
    def __init__(self, service_url: str = "http://localhost:4000"):
        self.service_url = service_url
        self.console = Console()
        self.running = True
        self.metrics = ServiceMetrics()
        
        # Data storage
        self.log_buffer = deque(maxlen=2000)
        self.error_buffer = deque(maxlen=200)
        self.alerts = deque(maxlen=100)
        self.metrics_history = deque(maxlen=300)  # 5 minutes at 1s intervals
        
        # Performance tracking
        self.last_metrics = {}
        self.start_time = time.time()
        self.last_message_count = 0
        self.request_count = 0
        self.error_count = 0
        
        # Layout and display
        self.layout = Layout()
        self.current_view = "dashboard"  # dashboard, logs, nodes, alerts
        self.views = ["dashboard", "logs", "nodes", "alerts"]
        self.view_index = 0
        self.setup_layout()
        
        # Keyboard handling
        self.key_pressed = None
        self.setup_keyboard_handlers()
        
        # Alert thresholds
        self.alert_thresholds = {
            "cpu_high": 80.0,
            "memory_high": 85.0,
            "response_time_high": 1000.0,
            "error_rate_high": 5.0
        }
    
    def setup_layout(self):
        """Setup responsive layout"""
        self.layout.split_column(
            Layout(name="header", size=4),
            Layout(name="main", ratio=1),
            Layout(name="footer", size=3)
        )
        
        self.layout["main"].split_row(
            Layout(name="left", ratio=3),
            Layout(name="right", ratio=2)
        )
        
        self.layout["left"].split_column(
            Layout(name="primary", ratio=2),
            Layout(name="secondary", ratio=1)
        )
        
        self.layout["right"].split_column(
            Layout(name="sidebar_top", ratio=1),
            Layout(name="sidebar_bottom", ratio=1)
        )
    
    def setup_keyboard_handlers(self):
        """Setup keyboard event handlers"""
        try:
            # Tab key - switch views
            keyboard.add_hotkey('tab', self.switch_view)
            
            # A key - clear alerts
            keyboard.add_hotkey('a', self.clear_alerts)
            
            # R key - force refresh
            keyboard.add_hotkey('r', self.force_refresh)
            
            # Q key - quit (alternative to Ctrl+C)
            keyboard.add_hotkey('q', self.quit_app)
            
            # Arrow keys for navigation
            keyboard.add_hotkey('right', lambda: self.switch_view(1))
            keyboard.add_hotkey('left', lambda: self.switch_view(-1))
            
        except Exception as e:
            # Keyboard handling might fail on some systems, continue without it
            pass
    
    def switch_view(self, direction=1):
        """Switch between different views"""
        self.view_index = (self.view_index + direction) % len(self.views)
        self.current_view = self.views[self.view_index]
        self.key_pressed = f"Switched to {self.current_view} view"
    
    def clear_alerts(self):
        """Clear all alerts"""
        resolved_count = len([a for a in self.alerts if not a.resolved])
        for alert in self.alerts:
            alert.resolved = True
        self.key_pressed = f"Cleared {resolved_count} alerts"
    
    def force_refresh(self):
        """Force a refresh of all data"""
        self.key_pressed = "Forcing refresh..."
    
    def quit_app(self):
        """Quit the application"""
        self.running = False
    
    async def fetch_detailed_metrics(self) -> Dict[str, Any]:
        """Fetch comprehensive metrics from service"""
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                # Health check
                start_time = time.time()
                async with session.get(f"{self.service_url}/api/health") as response:
                    health_time = (time.time() - start_time) * 1000
                    health_data = await response.json() if response.status == 200 else {}
                
                # Detailed metrics
                start_time = time.time()
                async with session.get(f"{self.service_url}/api/metrics") as response:
                    metrics_time = (time.time() - start_time) * 1000
                    metrics_data = await response.json() if response.status == 200 else {}
                
                return {
                    "health": health_data,
                    "metrics": metrics_data,
                    "response_times": {"health": health_time, "metrics": metrics_time},
                    "status": "ok"
                }
        except Exception as e:
            return {"error": str(e), "status": "error"}
    
    def get_enhanced_system_metrics(self) -> Dict[str, Any]:
        """Get detailed system metrics"""
        try:
            # Find BEAM/Elixir processes
            beam_procs = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'create_time']):
                try:
                    if any(keyword in proc.info['name'].lower() 
                           for keyword in ['beam', 'elixir', 'erl']):
                        beam_procs.append(proc)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            # Aggregate metrics
            total_cpu = sum(proc.cpu_percent() for proc in beam_procs)
            total_memory = sum(proc.memory_info().rss for proc in beam_procs)
            
            # System metrics
            cpu = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/' if os.name != 'nt' else 'C:\\')
            
            # Network I/O
            net_io = psutil.net_io_counters()
            
            return {
                "beam": {
                    "process_count": len(beam_procs),
                    "cpu_usage": total_cpu,
                    "memory_usage": total_memory,
                    "memory_percent": (total_memory / memory.total * 100) if memory.total > 0 else 0
                },
                "system": {
                    "cpu_percent": cpu,
                    "memory": {
                        "percent": memory.percent,
                        "total": memory.total,
                        "available": memory.available,
                        "used": memory.used
                    },
                    "disk": {
                        "percent": (disk.used / disk.total * 100) if disk.total > 0 else 0,
                        "total": disk.total,
                        "used": disk.used,
                        "free": disk.free
                    },
                    "network": {
                        "bytes_sent": net_io.bytes_sent,
                        "bytes_recv": net_io.bytes_recv,
                        "packets_sent": net_io.packets_sent,
                        "packets_recv": net_io.packets_recv
                    }
                }
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def collect_all_metrics(self):
        """Collect and process all metrics"""
        service_data = await self.fetch_detailed_metrics()
        system_data = self.get_enhanced_system_metrics()
        
        # Process service metrics
        if service_data.get("status") == "ok":
            health = service_data.get("health", {})
            metrics = service_data.get("metrics", {})
            
            # Basic info
            self.metrics.node_name = health.get("node", "unknown")
            self.metrics.connected_nodes = health.get("connected_nodes", [])
            self.metrics.status = health.get("status", "unknown")
            
            # Application metrics
            app_metrics = metrics.get("application", {})
            self.metrics.active_channels = app_metrics.get("active_channels", 0)
            self.metrics.active_connections = app_metrics.get("connections", 0)
            current_messages = app_metrics.get("total_messages", 0)
            
            # Calculate message rate
            if self.last_message_count > 0:
                self.metrics.message_rate = current_messages - self.last_message_count
            self.last_message_count = current_messages
            self.metrics.total_messages = current_messages
            
            # Response times
            resp_times = service_data.get("response_times", {})
            self.metrics.response_time = sum(resp_times.values()) / len(resp_times) if resp_times else 0
            
            # System metrics from service
            sys_metrics = metrics.get("system", {})
            memory_info = sys_metrics.get("memory", {})
            self.metrics.memory_total = memory_info.get("total", 0)
            self.metrics.memory_allocated = memory_info.get("allocated", 0)
            self.metrics.process_count = sys_metrics.get("processes", 0)
            
        else:
            self.metrics.status = "error"
            self.add_alert("ERROR", f"Service unreachable: {service_data.get('error', 'Unknown error')}", "service")
        
        # Process system metrics
        if "error" not in system_data:
            beam_metrics = system_data.get("beam", {})
            self.metrics.cpu_usage = beam_metrics.get("cpu_usage", 0)
            self.metrics.memory_usage = beam_metrics.get("memory_percent", 0)
            
            sys_metrics = system_data.get("system", {})
            self.metrics.disk_usage = sys_metrics.get("disk", {}).get("percent", 0)
            self.metrics.network_io = sys_metrics.get("network", {})
        
        # Store history
        timestamp = time.time()
        self.metrics_history.append({
            "timestamp": timestamp,
            "cpu": self.metrics.cpu_usage,
            "memory": self.metrics.memory_usage,
            "response_time": self.metrics.response_time,
            "connections": self.metrics.active_connections,
            "channels": self.metrics.active_channels,
            "messages": self.metrics.total_messages,
            "nodes": len(self.metrics.connected_nodes) + 1
        })
        
        # Check for alerts
        self.check_alerts()
        
        # Simulate some log entries for demo
        self.simulate_enhanced_logs()
    
    def add_alert(self, level: str, message: str, source: str):
        """Add a new alert"""
        alert = Alert(
            timestamp=datetime.now(),
            level=level,
            message=message,
            source=source
        )
        self.alerts.appendleft(alert)
    
    def check_alerts(self):
        """Check metrics against thresholds and generate alerts"""
        # CPU usage alert
        if self.metrics.cpu_usage > self.alert_thresholds["cpu_high"]:
            self.add_alert("WARN", f"High CPU usage: {self.metrics.cpu_usage:.1f}%", "system")
        
        # Memory usage alert
        if self.metrics.memory_usage > self.alert_thresholds["memory_high"]:
            self.add_alert("WARN", f"High memory usage: {self.metrics.memory_usage:.1f}%", "system")
        
        # Response time alert
        if self.metrics.response_time > self.alert_thresholds["response_time_high"]:
            self.add_alert("WARN", f"High response time: {self.metrics.response_time:.1f}ms", "performance")
        
        # Service status alert
        if self.metrics.status != "healthy" and self.metrics.status != "unknown":
            self.add_alert("ERROR", f"Service status: {self.metrics.status}", "service")
    
    def simulate_enhanced_logs(self):
        """Generate realistic log entries for demo"""
        if len(self.log_buffer) < 100:  # Keep generating logs for demo
            timestamp = datetime.now()
            
            log_templates = [
                ("[INFO]", "green", "User user_{} connected to channel '{}'"),
                ("[INFO]", "green", "Message broadcast to {} users in channel '{}'"),
                ("[DEBUG]", "blue", "WebSocket heartbeat from connection {}"),
                ("[INFO]", "green", "Channel '{}' created by user_{}"),
                ("[WARN]", "yellow", "Rate limit triggered for user_{}: {} requests/min"),
                ("[DEBUG]", "blue", "PubSub message routed to {} nodes"),
                ("[INFO]", "green", "Node {} joined cluster"),
                ("[ERROR]", "red", "Failed to deliver message to user_{}: connection closed"),
                ("[INFO]", "green", "Cluster sync completed: {} nodes active"),
                ("[DEBUG]", "blue", "Memory cleanup: freed {} bytes"),
            ]
            
            level, color, template = log_templates[int(time.time()) % len(log_templates)]
            
            # Generate realistic values
            user_id = f"user_{hash(str(time.time())) % 1000}"
            channel_names = ["general", "tech", "random", "announcements", "off-topic"]
            channel = channel_names[int(time.time()) % len(channel_names)]
            node_name = f"chat{(int(time.time()) % 3) + 1}@127.0.0.1"
            
            try:
                if "{}" in template:
                    if "Rate limit" in template:
                        message = template.format(user_id, 150 + (int(time.time()) % 50))
                    elif "broadcast to" in template:
                        message = template.format(5 + (int(time.time()) % 15), channel)
                    elif "connection" in template or "user_" in template:
                        message = template.format(user_id)
                    elif "Channel" in template and "created" in template:
                        message = template.format(channel, user_id)
                    elif "nodes" in template:
                        message = template.format(len(self.metrics.connected_nodes) + 1)
                    elif "freed" in template:
                        message = template.format(f"{1024 * (1 + int(time.time()) % 100)}KB")
                    else:
                        message = template.format(node_name)
                else:
                    message = template
            except:
                message = "System message"
            
            log_entry = f"[{timestamp.strftime('%H:%M:%S.%f')[:-3]}] {level} {message}"
            self.log_buffer.append((log_entry, color))
    
    def create_enhanced_header(self) -> Panel:
        """Create enhanced header with more info"""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        uptime_str = str(timedelta(seconds=int(time.time() - self.start_time)))
        
        # Status indicators
        status_color = {
            "healthy": "green",
            "degraded": "yellow", 
            "error": "red",
            "unknown": "dim"
        }.get(self.metrics.status, "dim")
        
        # Alert count
        active_alerts = len([a for a in self.alerts if not a.resolved])
        alert_text = f"🚨 {active_alerts}" if active_alerts > 0 else "✅ 0"
        alert_color = "red" if active_alerts > 0 else "green"
        
        # Key press feedback
        key_feedback = ""
        if self.key_pressed:
            key_feedback = f" | {self.key_pressed}"
            # Clear after showing
            if time.time() - getattr(self, 'key_press_time', 0) > 2:
                self.key_pressed = None
        
        header_content = Table.grid(padding=1)
        header_content.add_column(style="cyan", justify="left")
        header_content.add_column(style="white", justify="center") 
        header_content.add_column(style="green", justify="right")
        
        header_content.add_row(
            f"🚀 Chat Service Monitor v2.0{key_feedback}",
            f"📡 {self.metrics.node_name} ({len(self.metrics.connected_nodes) + 1} nodes)",
            f"⏰ {current_time}"
        )
        
        header_content.add_row(
            f"📊 View: {self.current_view.title()} ({self.view_index + 1}/{len(self.views)})",
            Text(f"Status: {self.metrics.status.upper()}", style=status_color),
            f"⏱️ Uptime: {uptime_str}"
        )
        
        return Panel(
            header_content,
            style="bold blue",
            box=box.DOUBLE,
            title=f"[{alert_color}]{alert_text} Alerts[/{alert_color}]"
        )
    
    def create_metrics_dashboard(self) -> Panel:
        """Create comprehensive metrics dashboard"""
        table = Table(box=box.ROUNDED, expand=True, show_header=False)
        table.add_column("Metric", style="cyan", width=18)
        table.add_column("Current", style="white", width=12)
        table.add_column("Trend", width=20)
        table.add_column("Graph", width=20)
        
        # Get recent history for trends
        recent_metrics = list(self.metrics_history)[-20:] if len(self.metrics_history) >= 20 else list(self.metrics_history)
        
        # CPU Usage Row
        cpu_values = [m["cpu"] for m in recent_metrics] if recent_metrics else [0]
        cpu_trend = "↗️" if len(cpu_values) > 1 and cpu_values[-1] > cpu_values[-2] else "↘️" if len(cpu_values) > 1 else "→"
        cpu_color = "red" if self.metrics.cpu_usage > 80 else "yellow" if self.metrics.cpu_usage > 60 else "green"
        cpu_bar = self.create_bar(self.metrics.cpu_usage, 100, cpu_color)
        cpu_spark = self.create_sparkline(cpu_values)
        
        table.add_row("🖥️ CPU Usage", f"{self.metrics.cpu_usage:.1f}%", f"{cpu_trend} {cpu_color}", cpu_spark)
        
        # Memory Usage Row
        mem_values = [m["memory"] for m in recent_metrics] if recent_metrics else [0]
        mem_trend = "↗️" if len(mem_values) > 1 and mem_values[-1] > mem_values[-2] else "↘️" if len(mem_values) > 1 else "→"
        mem_color = "red" if self.metrics.memory_usage > 85 else "yellow" if self.metrics.memory_usage > 70 else "green"
        mem_spark = self.create_sparkline(mem_values)
        
        table.add_row("🧠 Memory", f"{self.metrics.memory_usage:.1f}%", f"{mem_trend} {mem_color}", mem_spark)
        
        # Response Time Row  
        resp_values = [min(m["response_time"], 2000) for m in recent_metrics] if recent_metrics else [0]
        resp_trend = "↗️" if len(resp_values) > 1 and resp_values[-1] > resp_values[-2] else "↘️" if len(resp_values) > 1 else "→"
        resp_color = "red" if self.metrics.response_time > 1000 else "yellow" if self.metrics.response_time > 500 else "green"
        resp_spark = self.create_sparkline(resp_values, max_val=2000)
        
        table.add_row("⚡ Response", f"{self.metrics.response_time:.0f}ms", f"{resp_trend} {resp_color}", resp_spark)
        
        # Connections Row
        conn_values = [m["connections"] for m in recent_metrics] if recent_metrics else [0]
        conn_trend = "↗️" if len(conn_values) > 1 and conn_values[-1] > conn_values[-2] else "↘️" if len(conn_values) > 1 else "→"
        conn_spark = self.create_sparkline(conn_values)
        
        table.add_row("🔗 Connections", str(self.metrics.active_connections), f"{conn_trend} blue", conn_spark)
        
        # Messages Row
        msg_values = [m["messages"] for m in recent_metrics] if recent_metrics else [0]
        msg_rate = f"(+{self.metrics.message_rate}/s)" if self.metrics.message_rate > 0 else ""
        msg_spark = self.create_sparkline(msg_values)
        
        table.add_row("💬 Messages", f"{self.metrics.total_messages} {msg_rate}", "📈 green", msg_spark)
        
        return Panel(table, title="📊 Live Metrics", border_style="green", box=box.ROUNDED)
    
    def create_bar(self, value: float, max_value: float, color: str, width: int = 15) -> Text:
        """Create a text-based progress bar"""
        filled = int((value / max_value) * width)
        bar = "█" * filled + "░" * (width - filled)
        return Text(bar, style=color)
    
    def create_sparkline(self, values: List[float], width: int = 20, max_val: Optional[float] = None) -> str:
        """Create a sparkline chart"""
        if not values or len(values) < 2:
            return "░" * width
            
        # Normalize values
        min_val = min(values)
        max_val = max_val or max(values)
        if max_val == min_val:
            return "▄" * width
            
        normalized = [(v - min_val) / (max_val - min_val) for v in values]
        
        # Create sparkline
        chars = "▁▂▃▄▅▆▇█"
        spark = ""
        
        # Sample values to fit width
        step = len(normalized) / width
        for i in range(width):
            idx = int(i * step)
            if idx < len(normalized):
                char_idx = int(normalized[idx] * (len(chars) - 1))
                spark += chars[char_idx]
            else:
                spark += "▁"
                
        return spark
    
    def create_cluster_panel(self) -> Panel:
        """Create cluster status panel"""
        tree = Tree("🌐 Cluster Status", style="bold blue")
        
        # Current node
        current = tree.add(
            Text.assemble(
                ("📍 ", "blue"),
                (f"{self.metrics.node_name}", "bold green"),
                (" (current)", "dim")
            )
        )
        current.add(f"Status: {self.metrics.status}", style="green")
        current.add(f"Connections: {self.metrics.active_connections}", style="cyan")
        current.add(f"Channels: {self.metrics.active_channels}", style="yellow")
        
        # Connected nodes
        if self.metrics.connected_nodes:
            for i, node in enumerate(self.metrics.connected_nodes):
                node_tree = tree.add(f"🔗 {node}", style="yellow")
                node_tree.add("Status: connected", style="green")
                # Simulate some stats for connected nodes
                node_tree.add(f"Load: {20 + (i * 15)}%", style="cyan")
        else:
            tree.add("No connected nodes", style="dim")
        
        # Cluster stats
        if len(self.metrics.connected_nodes) > 0:
            stats = tree.add("📈 Cluster Stats", style="bold cyan")
            total_nodes = len(self.metrics.connected_nodes) + 1
            stats.add(f"Total nodes: {total_nodes}")
            stats.add(f"Avg load: {self.metrics.cpu_usage / total_nodes:.1f}%")
        
        return Panel(tree, title="🖧 Cluster", border_style="blue")
    
    def create_logs_panel(self) -> Panel:
        """Create enhanced logs panel"""
        if not self.log_buffer:
            return Panel("No logs available", title="📝 Live Logs", border_style="cyan")
        
        # Show last 15 logs
        log_lines = []
        for log_entry, color in list(self.log_buffer)[-15:]:
            log_lines.append(Text(log_entry, style=color))
        
        content = Text("\n").join(log_lines)
        
        return Panel(
            content,
            title=f"📝 Live Logs ({len(self.log_buffer)} total)",
            border_style="cyan",
            box=box.ROUNDED
        )
    
    def create_alerts_panel(self) -> Panel:
        """Create alerts panel"""
        if not self.alerts:
            return Panel(
                Text("No alerts", style="green"),
                title="🚨 Alerts",
                border_style="green"
            )
        
        alert_table = Table(show_header=False, box=None, expand=True)
        alert_table.add_column("Time", width=8)
        alert_table.add_column("Level", width=8) 
        alert_table.add_column("Message", ratio=1)
        
        for alert in list(self.alerts)[:8]:  # Show last 8 alerts
            level_color = {
                "INFO": "blue",
                "WARN": "yellow", 
                "ERROR": "red",
                "CRITICAL": "bold red"
            }.get(alert.level, "white")
            
            alert_table.add_row(
                alert.timestamp.strftime("%H:%M:%S"),
                Text(alert.level, style=level_color),
                alert.message[:50] + "..." if len(alert.message) > 50 else alert.message
            )
        
        active_count = len([a for a in self.alerts if not a.resolved])
        border_color = "red" if active_count > 0 else "green"
        
        return Panel(
            alert_table,
            title=f"🚨 Alerts ({active_count} active)",
            border_style=border_color
        )
    
    def create_detailed_logs_panel(self) -> Panel:
        """Create detailed logs view"""
        if not self.log_buffer:
            return Panel("No logs available", title="📝 Detailed Logs", border_style="cyan")
        
        log_text = Text()
        for log_entry, color in list(self.log_buffer)[-30:]:  # Show last 30 logs
            log_text.append(log_entry + "\n", style=color)
        
        return Panel(log_text, title=f"📝 Detailed Logs ({len(self.log_buffer)} total)", border_style="cyan")
    
    def create_log_stats_panel(self) -> Panel:
        """Create log statistics panel"""
        if not self.log_buffer:
            return Panel("No log statistics", title="📈 Log Stats", border_style="yellow")
        
        # Count log levels
        info_count = sum(1 for entry, _ in self.log_buffer if "[INFO]" in entry)
        warn_count = sum(1 for entry, _ in self.log_buffer if "[WARN]" in entry)
        error_count = sum(1 for entry, _ in self.log_buffer if "[ERROR]" in entry)
        debug_count = sum(1 for entry, _ in self.log_buffer if "[DEBUG]" in entry)
        
        stats_text = f"""Log Statistics:
📗 INFO:  {info_count:4d}
📙 WARN:  {warn_count:4d}  
📕 ERROR: {error_count:4d}
🔍 DEBUG: {debug_count:4d}

Total: {len(self.log_buffer)} entries
Rate: ~{len(self.log_buffer) / max(1, time.time() - self.start_time):.1f}/sec"""
        
        return Panel(stats_text, title="📈 Log Statistics", border_style="yellow")
    
    def create_detailed_cluster_panel(self) -> Panel:
        """Create detailed cluster view"""
        tree = Tree("🌐 Detailed Cluster View", style="bold blue")
        
        # Current node with more details
        current = tree.add(Text.assemble(
            ("📍 ", "blue"),
            (f"{self.metrics.node_name}", "bold green"),
            (" (current)", "dim")
        ))
        current.add(f"Status: {self.metrics.status}", style="green")
        current.add(f"Connections: {self.metrics.active_connections}", style="cyan")
        current.add(f"Channels: {self.metrics.active_channels}", style="yellow")
        current.add(f"CPU: {self.metrics.cpu_usage:.1f}%", style="magenta")
        current.add(f"Memory: {self.metrics.memory_usage:.1f}%", style="magenta")
        current.add(f"Response Time: {self.metrics.response_time:.1f}ms", style="blue")
        
        # Connected nodes with simulated details
        if self.metrics.connected_nodes:
            for i, node in enumerate(self.metrics.connected_nodes):
                node_tree = tree.add(f"🔗 {node}", style="yellow")
                node_tree.add("Status: connected", style="green")
                node_tree.add(f"Load: {20 + (i * 15)}%", style="cyan")
                node_tree.add(f"Connections: {15 + (i * 5)}", style="cyan")
                node_tree.add(f"Latency: {10 + (i * 5)}ms", style="blue")
        else:
            tree.add("No connected nodes", style="dim")
        
        return Panel(tree, title="🖧 Detailed Cluster", border_style="blue")
    
    def create_node_performance_panel(self) -> Panel:
        """Create node performance comparison"""
        table = Table(show_header=True, box=box.ROUNDED)
        table.add_column("Node", style="cyan")
        table.add_column("CPU", style="red")
        table.add_column("Memory", style="yellow") 
        table.add_column("Connections", style="blue")
        table.add_column("Latency", style="green")
        
        # Current node
        table.add_row(
            f"📍 {self.metrics.node_name}",
            f"{self.metrics.cpu_usage:.1f}%",
            f"{self.metrics.memory_usage:.1f}%",
            str(self.metrics.active_connections),
            f"{self.metrics.response_time:.0f}ms"
        )
        
        # Connected nodes (simulated data)
        for i, node in enumerate(self.metrics.connected_nodes):
            table.add_row(
                f"🔗 {node}",
                f"{20 + (i * 15):.1f}%",
                f"{30 + (i * 10):.1f}%",
                str(15 + (i * 5)),
                f"{10 + (i * 5)}ms"
            )
        
        return Panel(table, title="⚡ Node Performance", border_style="magenta")
    
    def create_detailed_alerts_panel(self) -> Panel:
        """Create detailed alerts view"""
        if not self.alerts:
            return Panel(
                Text("✅ No alerts - System running smoothly!", style="green"),
                title="🚨 Detailed Alerts",
                border_style="green"
            )
        
        alert_table = Table(show_header=True, box=box.ROUNDED, expand=True)
        alert_table.add_column("Time", width=12)
        alert_table.add_column("Level", width=8)
        alert_table.add_column("Source", width=12)
        alert_table.add_column("Message", ratio=1)
        alert_table.add_column("Status", width=10)
        
        for alert in list(self.alerts):
            level_color = {
                "INFO": "blue",
                "WARN": "yellow",
                "ERROR": "red", 
                "CRITICAL": "bold red"
            }.get(alert.level, "white")
            
            status_text = "✅ Resolved" if alert.resolved else "🔥 Active"
            status_color = "green" if alert.resolved else "red"
            
            alert_table.add_row(
                alert.timestamp.strftime("%H:%M:%S"),
                Text(alert.level, style=level_color),
                alert.source,
                alert.message,
                Text(status_text, style=status_color)
            )
        
        active_count = len([a for a in self.alerts if not a.resolved])
        return Panel(
            alert_table,
            title=f"🚨 Detailed Alerts ({active_count} active / {len(self.alerts)} total)",
            border_style="red" if active_count > 0 else "green"
        )
    
    def create_alert_stats_panel(self) -> Panel:
        """Create alert statistics panel"""
        if not self.alerts:
            return Panel("No alert statistics", title="📊 Alert Stats", border_style="green")
        
        # Count by level
        info_alerts = sum(1 for a in self.alerts if a.level == "INFO")
        warn_alerts = sum(1 for a in self.alerts if a.level == "WARN")
        error_alerts = sum(1 for a in self.alerts if a.level == "ERROR")
        critical_alerts = sum(1 for a in self.alerts if a.level == "CRITICAL")
        
        active_alerts = len([a for a in self.alerts if not a.resolved])
        resolved_alerts = len([a for a in self.alerts if a.resolved])
        
        stats_text = f"""Alert Statistics:
🔵 INFO:     {info_alerts:3d}
🟡 WARN:     {warn_alerts:3d}
🔴 ERROR:    {error_alerts:3d}
⚫ CRITICAL: {critical_alerts:3d}

🔥 Active:   {active_alerts:3d}
✅ Resolved: {resolved_alerts:3d}

Press 'A' to clear all alerts"""
        
        return Panel(stats_text, title="📊 Alert Statistics", border_style="yellow")

    def create_footer(self) -> Panel:
        """Create interactive footer"""
        footer_items = [
            ("Tab/←→", "Switch View"),
            ("A", "Clear Alerts"),
            ("R", "Refresh"),
            ("Q", "Quit")
        ]
        
        footer_text = Text.assemble(
            *[item for items in [
                [(f"{key}", "bold cyan"), (f" {desc}  ", "dim")] 
                for key, desc in footer_items
            ] for item in items]
        )
        
        # Add system info
        runtime = str(timedelta(seconds=int(time.time() - self.start_time)))
        footer_text.append(f"│ Runtime: {runtime} │ ", style="dim")
        footer_text.append(f"Refresh: 1s │ ", style="green")
        footer_text.append(f"View: {self.current_view.title()}", style="cyan")
        
        return Panel(Align.center(footer_text), style="dim")
    
    def update_display(self):
        """Update display based on current view"""
        self.layout["header"].update(self.create_enhanced_header())
        
        if self.current_view == "dashboard":
            self.layout["primary"].update(self.create_metrics_dashboard())
            self.layout["secondary"].update(self.create_logs_panel())
            self.layout["sidebar_top"].update(self.create_cluster_panel())
            self.layout["sidebar_bottom"].update(self.create_alerts_panel())
        elif self.current_view == "logs":
            # Full screen logs view
            self.layout["primary"].update(self.create_detailed_logs_panel())
            self.layout["secondary"].update(self.create_log_stats_panel())
            self.layout["sidebar_top"].update(self.create_cluster_panel())
            self.layout["sidebar_bottom"].update(self.create_alerts_panel())
        elif self.current_view == "nodes":
            # Full screen cluster view
            self.layout["primary"].update(self.create_detailed_cluster_panel())
            self.layout["secondary"].update(self.create_node_performance_panel())
            self.layout["sidebar_top"].update(self.create_metrics_dashboard())
            self.layout["sidebar_bottom"].update(self.create_alerts_panel())
        elif self.current_view == "alerts":
            # Full screen alerts view
            self.layout["primary"].update(self.create_detailed_alerts_panel())
            self.layout["secondary"].update(self.create_alert_stats_panel())
            self.layout["sidebar_top"].update(self.create_cluster_panel())
            self.layout["sidebar_bottom"].update(self.create_metrics_dashboard())
        
        self.layout["footer"].update(self.create_footer())
    
    async def monitor_loop(self):
        """Enhanced monitoring loop"""
        while self.running:
            try:
                await self.collect_all_metrics()
                await asyncio.sleep(1)
            except Exception as e:
                self.add_alert("ERROR", f"Monitor error: {str(e)}", "monitor")
                await asyncio.sleep(1)
    
    def signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully"""
        self.running = False
    
    async def run(self):
        """Run the enhanced monitoring system"""
        signal.signal(signal.SIGINT, self.signal_handler)
        
        # Start monitoring
        monitor_task = asyncio.create_task(self.monitor_loop())
        
        try:
            with Live(
                self.layout,
                console=self.console,
                screen=True,
                refresh_per_second=4
            ) as live:
                self.console.print("🚀 Starting Advanced Chat Service Monitor...", style="bold green")
                await asyncio.sleep(1)
                
                while self.running:
                    self.update_display()
                    await asyncio.sleep(0.25)
        
        except KeyboardInterrupt:
            pass
        finally:
            self.running = False
            monitor_task.cancel()
            try:
                await monitor_task
            except asyncio.CancelledError:
                pass
            
            self.console.print("\n👋 Advanced Monitor stopped.", style="bold yellow")

async def main():
    """Enhanced main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Advanced Chat Service Monitor v2.0")
    parser.add_argument("--url", default="http://localhost:4000",
                       help="Chat service URL (default: http://localhost:4000)")
    parser.add_argument("--refresh", type=float, default=1.0,
                       help="Refresh interval in seconds (default: 1.0)")
    parser.add_argument("--debug", action="store_true",
                       help="Enable debug output")
    
    args = parser.parse_args()
    
    monitor = AdvancedMonitor(service_url=args.url)
    await monitor.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)