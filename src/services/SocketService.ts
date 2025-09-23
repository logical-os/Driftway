import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { updateMessageStatus } from './dbService';

interface ISocket extends Socket {
    userId?: string;
}

let io: Server;

export const initializeSocket = (serverIo: Server) => {
    io = serverIo;
    io.use((socket: ISocket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            logger.warn('Socket connection attempt without token.');
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { user: { id: string } };
            socket.userId = decoded.user.id;
            next();
        } catch (err) {
            logger.error('Socket authentication error:', err);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: ISocket) => {
        logger.info('A user connected with id:', socket.userId);

        if (socket.userId) {
            socket.join(socket.userId);
        }

        socket.on('joinChannel', (channelId) => {
            socket.join(channelId);
            logger.info(`User ${socket.userId} joined channel ${channelId}`);
        });

        socket.on('messageDelivered', async ({ messageId }) => {
            try {
                const updatedMessage = await updateMessageStatus(messageId, 'delivered');
                if (updatedMessage) {
                    const senderId = updatedMessage.from.toString();
                    io.to(senderId).emit('messageStatusUpdate', updatedMessage);
                }
            } catch (error) {
                logger.error('Error handling messageDelivered event:', error);
            }
        });

        socket.on('messageRead', async ({ messageId }) => {
            try {
                const updatedMessage = await updateMessageStatus(messageId, 'read');
                if (updatedMessage) {
                    const senderId = updatedMessage.from.toString();
                    io.to(senderId).emit('messageStatusUpdate', updatedMessage);
                }
            } catch (error) {
                logger.error('Error handling messageRead event:', error);
            }
        });

        socket.on('disconnect', () => {
            logger.info('User disconnected:', socket.userId);
        });
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

