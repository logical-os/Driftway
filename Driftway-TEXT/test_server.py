#!/usr/bin/env python3
"""
Quick test to verify the monitoring script works
This creates a mock server to test the monitoring interface
"""

import asyncio
import json
import time
from aiohttp import web

async def health_handler(request):
    """Mock health endpoint"""
    return web.json_response({
        "node": "test_node@127.0.0.1",
        "connected_nodes": ["test2@127.0.0.1", "test3@127.0.0.1"],
        "uptime": int(time.time() * 1000),
        "status": "healthy"
    })

async def metrics_handler(request):
    """Mock metrics endpoint"""
    return web.json_response({
        "system": {
            "node": "test_node@127.0.0.1",
            "connected_nodes": ["test2@127.0.0.1", "test3@127.0.0.1"],
            "uptime": int(time.time() * 1000),
            "memory": {
                "total": 1024 * 1024 * 512,  # 512MB
                "allocated": 1024 * 1024 * 256  # 256MB
            },
            "processes": 150,
            "ports": 25,
            "schedulers": 8
        },
        "application": {
            "active_channels": 5,
            "total_messages": 1000 + int(time.time()) % 100,
            "connections": 25 + int(time.time()) % 10,
            "channels": [
                {
                    "channel_id": "general",
                    "active_users": 15,
                    "message_count": 500
                },
                {
                    "channel_id": "tech", 
                    "active_users": 8,
                    "message_count": 300
                }
            ]
        },
        "timestamp": int(time.time() * 1000)
    })

async def init_app():
    """Initialize the mock server"""
    app = web.Application()
    app.router.add_get('/api/health', health_handler)
    app.router.add_get('/api/metrics', metrics_handler)
    return app

async def main():
    """Run the mock server"""
    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 4000)
    
    print("🚀 Mock Chat Service running on http://localhost:4000")
    print("📊 Health: http://localhost:4000/api/health")
    print("📈 Metrics: http://localhost:4000/api/metrics")
    print("🎯 Now run: python monitoring.sh or python monitoring_advanced.sh")
    print("Press Ctrl+C to stop...")
    
    await site.start()
    
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 Mock server stopped.")

if __name__ == "__main__":
    asyncio.run(main())