import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import authRoutes from './api/authRoutes';
import userRoutes from './api/userRoutes';
import messageRoutes from './api/messageRoutes';
import serverRoutes from './api/serverRoutes';
import { initializeSocket } from './services/socketService';
import { logger } from './utils/logger';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { dbService } from './services/dbService';

dotenv.config();

const app = express();
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    }
});

initializeSocket(io);

app.use('/api', apiKeyAuth); // Protect all API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/servers', serverRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await dbService.healthCheck();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbHealth,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Database health check failed'
        });
    }
});

const PORT = process.env.PORT || 3000;

// Database connection and initialization
const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        logger.info('Connected to MongoDB');
        
        // Initialize database collections and indexes
        await dbService.initializeCollections();
        
        // Clean expired sessions on startup
        await dbService.cleanExpiredSessions();
        
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

app.get('/', (req, res) => {
    res.json({
        message: 'Driftway Backend API',
        version: '1.0.0',
        status: 'running'
    });
});

// Start server
const startServer = async () => {
    await connectDatabase();
    
    server.listen(PORT, () => {
        logger.info(`Driftway server running on port ${PORT}`);
        logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
};

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await mongoose.connection.close();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});
