import Server from '../models/Server';
import Channel from '../models/Channel';
import Message from '../models/Message';
import User from '../models/User';
import Session from '../models/Session';
import MessageReaction from '../models/MessageReaction';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Database service that handles auto-creation of collections and indexes
class DatabaseService {
    private static instance: DatabaseService;
    private collectionsInitialized = false;

    private constructor() {}

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    // Initialize collections and indexes if they don't exist
    public async initializeCollections(): Promise<void> {
        if (this.collectionsInitialized) return;

        try {
            logger.info('Initializing database collections and indexes...');

            // Get the default connection
            const db = mongoose.connection.db;
            if (!db) {
                throw new Error('Database connection not established');
            }

            // Check and create collections if they don't exist
            const existingCollections = await db.listCollections().toArray();
            const existingNames = existingCollections.map(col => col.name);

            const requiredCollections = [
                'users', 'sessions', 'servers', 'channels', 
                'messages', 'messagereactions'
            ];

            for (const collectionName of requiredCollections) {
                if (!existingNames.includes(collectionName)) {
                    await db.createCollection(collectionName);
                    logger.info(`Created collection: ${collectionName}`);
                }
            }

            // Create indexes for performance
            await this.createIndexes();
            
            this.collectionsInitialized = true;
            logger.info('Database collections and indexes initialized successfully');
        } catch (error) {
            logger.error('Error initializing database collections:', error);
            throw error;
        }
    }

    private async createIndexes(): Promise<void> {
        try {
            // Users indexes
            await User.collection.createIndex({ username: 1 }, { unique: true, background: true });
            await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
            await User.collection.createIndex({ status: 1 }, { background: true });

            // Sessions indexes
            await Session.collection.createIndex({ user: 1 }, { background: true });
            await Session.collection.createIndex({ jwt: 1 }, { unique: true, background: true });
            await Session.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });

            // Messages indexes
            await Message.collection.createIndex({ channel: 1, timestamp: -1 }, { background: true });
            await Message.collection.createIndex({ from: 1, timestamp: -1 }, { background: true });
            await Message.collection.createIndex({ timestamp: -1 }, { background: true });

            // Servers indexes
            await Server.collection.createIndex({ owner: 1 }, { background: true });
            await Server.collection.createIndex({ name: 1 }, { background: true });

            // Channels indexes
            await Channel.collection.createIndex({ server: 1 }, { background: true });

            // Message reactions indexes
            await MessageReaction.collection.createIndex({ message: 1, user: 1, emoji: 1 }, { unique: true, background: true });

            logger.info('Database indexes created successfully');
        } catch (error) {
            logger.error('Error creating database indexes:', error);
            throw error;
        }
    }

    // Server operations
    public async createServer(name: string, ownerId: string) {
        await this.initializeCollections();
        try {
            const server = new Server({
                name,
                owner: ownerId,
                members: [ownerId],
            });
            await server.save();
            logger.info(`Server created: ${name} by user ${ownerId}`);
            return server;
        } catch (error) {
            logger.error('Error creating server:', error);
            throw new Error('Could not create server');
        }
    }

    // Channel operations
    public async createChannel(name: string, serverId: string) {
        await this.initializeCollections();
        try {
            const channel = new Channel({
                name,
                server: serverId,
            });
            await channel.save();
            logger.info(`Channel created: ${name} in server ${serverId}`);
            return channel;
        } catch (error) {
            logger.error('Error creating channel:', error);
            throw new Error('Could not create channel');
        }
    }

    // Server membership operations
    public async joinServer(serverId: string, userId: string) {
        await this.initializeCollections();
        try {
            const server = await Server.findById(serverId);
            if (!server) {
                throw new Error('Server not found');
            }
            if (!server.members.includes(userId as any)) {
                server.members.push(userId as any);
                await server.save();
                logger.info(`User ${userId} joined server ${serverId}`);
            }
            return server;
        } catch (error) {
            logger.error('Error joining server:', error);
            throw new Error('Could not join server');
        }
    }

    // Message operations
    public async updateMessageStatus(messageId: string, status: 'delivered' | 'read') {
        await this.initializeCollections();
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.status = status;
                await message.save();
                logger.info(`Message ${messageId} status updated to ${status}`);
                return message;
            }
            throw new Error('Message not found');
        } catch (error) {
            logger.error('Error updating message status:', error);
            throw new Error('Could not update message status');
        }
    }

    // User operations
    public async getUserById(userId: string) {
        await this.initializeCollections();
        try {
            return await User.findById(userId).select('-passwordHash');
        } catch (error) {
            logger.error('Error getting user:', error);
            throw new Error('Could not get user');
        }
    }

    // Session operations
    public async cleanExpiredSessions() {
        await this.initializeCollections();
        try {
            const result = await Session.deleteMany({ expiresAt: { $lt: new Date() } });
            logger.info(`Cleaned ${result.deletedCount} expired sessions`);
            return result.deletedCount;
        } catch (error) {
            logger.error('Error cleaning expired sessions:', error);
            throw new Error('Could not clean expired sessions');
        }
    }

    // Database health check
    public async healthCheck(): Promise<{ status: string; collections: string[]; indexes: number }> {
        try {
            const db = mongoose.connection.db;
            if (!db) {
                throw new Error('Database connection not established');
            }

            const collections = await db.listCollections().toArray();
            const collectionNames = collections.map(col => col.name);
            
            // Count total indexes
            let totalIndexes = 0;
            for (const collection of collections) {
                const indexes = await db.collection(collection.name).indexes();
                totalIndexes += indexes.length;
            }

            return {
                status: 'healthy',
                collections: collectionNames,
                indexes: totalIndexes
            };
        } catch (error) {
            logger.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                collections: [],
                indexes: 0
            };
        }
    }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance();

// Legacy exports for backward compatibility
export const createServer = (name: string, ownerId: string) => dbService.createServer(name, ownerId);
export const createChannel = (name: string, serverId: string) => dbService.createChannel(name, serverId);
export const joinServer = (serverId: string, userId: string) => dbService.joinServer(serverId, userId);
export const updateMessageStatus = (messageId: string, status: 'delivered' | 'read') => dbService.updateMessageStatus(messageId, status);
