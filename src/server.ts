import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import config from './config';
import routes from './routes';
import { SocketService } from './services/SocketService';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';

// Create Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO service
const socketService = new SocketService(server);

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Driftway Messaging API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      conversations: '/api/conversations',
      messages: '/api/messages'
    },
    websocket: {
      enabled: true,
      events: [
        'authenticate',
        'join-conversation',
        'leave-conversation',
        'send-message',
        'typing-start',
        'typing-stop',
        'mark-as-read'
      ]
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = () => {
  server.listen(config.port, () => {
    console.log('🚀 Driftway server started successfully!');
    console.log(`📡 Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 API URL: http://localhost:${config.port}`);
    console.log(`⚡ WebSocket enabled for real-time messaging`);
    console.log(`📋 API Documentation available at: http://localhost:${config.port}`);
    
    if (config.nodeEnv === 'development') {
      console.log('\n🛠️  Development mode features:');
      console.log('   • Request logging enabled');
      console.log('   • CORS enabled for all origins');
      console.log('   • Error stack traces included');
    }
  });
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    console.log('👋 Goodbye!');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server with E2E encryption support
startServer(); // Updated CORS configuration for Socket.IO

export { app, server, socketService };