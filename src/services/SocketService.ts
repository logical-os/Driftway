import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { 
  SocketEvents,
  SendMessageSocketData,
  UserActivityData,
  TypingData,
  MarkAsReadData,
  AuthenticatedSocket
} from '../models';
import { messageService, conversationService, userService } from '../services';
import config from '../config';

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, { socketId: string; userId: string; username: string }> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: true, // Allow all origins in development
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle user authentication/identification
      socket.on('authenticate', (data: { userId: string; username: string }) => {
        this.handleAuthenticate(socket, data);
      });

      // Handle joining conversations
      socket.on('join-conversation', (conversationId: string) => {
        this.handleJoinConversation(socket, conversationId);
      });

      // Handle leaving conversations
      socket.on('leave-conversation', (conversationId: string) => {
        this.handleLeaveConversation(socket, conversationId);
      });

      // Handle sending messages
      socket.on('send-message', (data: SendMessageSocketData) => {
        this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing-start', (conversationId: string) => {
        this.handleTypingStart(socket, conversationId);
      });

      socket.on('typing-stop', (conversationId: string) => {
        this.handleTypingStop(socket, conversationId);
      });

      // Handle marking messages as read
      socket.on('mark-as-read', (data: MarkAsReadData) => {
        this.handleMarkAsRead(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleAuthenticate(socket: Socket, data: { userId: string; username: string }): Promise<void> {
    try {
      // Store user connection info
      this.connectedUsers.set(socket.id, {
        socketId: socket.id,
        userId: data.userId,
        username: data.username
      });

      // Update user online status
      await userService.setUserOnlineStatus(data.userId, true);

      // Join user to their own room for direct messages
      socket.join(`user:${data.userId}`);

      console.log(`User ${data.username} (${data.userId}) authenticated`);

      // Notify other users about this user coming online
      socket.broadcast.emit('user-online', {
        userId: data.userId,
        username: data.username
      });

      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('error', {
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }

  private async handleJoinConversation(socket: Socket, conversationId: string): Promise<void> {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    // Verify user is a participant in the conversation
    const conversation = await conversationService.getConversationById(conversationId);
    if (!conversation || !conversation.participants.includes(userInfo.userId)) {
      socket.emit('error', { message: 'Not authorized to join this conversation' });
      return;
    }

    socket.join(`conversation:${conversationId}`);
    console.log(`User ${userInfo.username} joined conversation ${conversationId}`);

    // Notify other participants
    const userActivityData: UserActivityData = {
      userId: userInfo.userId,
      conversationId,
      username: userInfo.username
    };

    socket.to(`conversation:${conversationId}`).emit('user-joined', userActivityData);
  }

  private handleLeaveConversation(socket: Socket, conversationId: string): void {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      return;
    }

    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${userInfo.username} left conversation ${conversationId}`);

    // Clear typing status if user was typing
    this.clearTypingStatus(conversationId, userInfo.userId);

    // Notify other participants
    const userActivityData: UserActivityData = {
      userId: userInfo.userId,
      conversationId,
      username: userInfo.username
    };

    socket.to(`conversation:${conversationId}`).emit('user-left', userActivityData);
  }

  private async handleSendMessage(socket: Socket, data: SendMessageSocketData): Promise<void> {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    try {
      // Create the message with encryption support
      const messageRequest = {
        conversationId: data.conversationId,
        content: data.content,
        messageType: data.messageType as any,
        // Pass encryption data if available
        encryptedContent: data.encryptedContent,
        encryptionIV: data.encryptionIV
      };

      const message = await messageService.createMessage(messageRequest, userInfo.userId);

      // Update conversation's last message
      await conversationService.updateLastMessage(data.conversationId, message.id);

      // Clear typing status
      this.clearTypingStatus(data.conversationId, userInfo.userId);

      // Emit to all participants in the conversation
      this.io.to(`conversation:${data.conversationId}`).emit('message-received', {
        ...message,
        senderUsername: userInfo.username
      });

      const encryptionStatus = message.isEncrypted ? '🔒 encrypted' : 'plain text';
      console.log(`${encryptionStatus} message sent in conversation ${data.conversationId} by ${userInfo.username}`);
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to send message',
        code: 'SEND_MESSAGE_ERROR'
      });
    }
  }

  private handleTypingStart(socket: Socket, conversationId: string): void {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      return;
    }

    // Add user to typing set for this conversation
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    this.typingUsers.get(conversationId)!.add(userInfo.userId);

    // Notify other participants
    const typingData: TypingData = {
      userId: userInfo.userId,
      conversationId,
      username: userInfo.username
    };

    socket.to(`conversation:${conversationId}`).emit('user-typing', typingData);
  }

  private handleTypingStop(socket: Socket, conversationId: string): void {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      return;
    }

    this.clearTypingStatus(conversationId, userInfo.userId);

    // Notify other participants
    const typingData: TypingData = {
      userId: userInfo.userId,
      conversationId,
      username: userInfo.username
    };

    socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', typingData);
  }

  private async handleMarkAsRead(socket: Socket, data: MarkAsReadData): Promise<void> {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo) {
      return;
    }

    const updatedMessage = await messageService.markAsRead(data.messageId, userInfo.userId);
    if (updatedMessage) {
      // Notify other participants that this message was read
      socket.to(`conversation:${data.conversationId}`).emit('message-read', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        userId: userInfo.userId,
        readAt: new Date()
      });
    }
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    const userInfo = this.connectedUsers.get(socket.id);
    if (userInfo) {
      console.log(`User ${userInfo.username} disconnected`);

      // Update user offline status
      await userService.setUserOnlineStatus(userInfo.userId, false);

      // Clear all typing statuses for this user
      this.typingUsers.forEach((typingSet, conversationId) => {
        if (typingSet.has(userInfo.userId)) {
          typingSet.delete(userInfo.userId);
          socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
            userId: userInfo.userId,
            conversationId,
            username: userInfo.username
          });
        }
      });

      // Notify other users about this user going offline
      socket.broadcast.emit('user-offline', {
        userId: userInfo.userId,
        username: userInfo.username
      });

      // Remove from connected users
      this.connectedUsers.delete(socket.id);
    }
  }

  private clearTypingStatus(conversationId: string, userId: string): void {
    const typingSet = this.typingUsers.get(conversationId);
    if (typingSet) {
      typingSet.delete(userId);
      if (typingSet.size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }
  }

  // Public method to send notifications to specific users
  public notifyUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Public method to send notifications to conversation participants
  public notifyConversation(conversationId: string, event: string, data: any): void {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get users connected to a specific conversation
  public getConversationUsers(conversationId: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    if (!room) return [];

    const userIds: string[] = [];
    room.forEach(socketId => {
      const userInfo = this.connectedUsers.get(socketId);
      if (userInfo) {
        userIds.push(userInfo.userId);
      }
    });

    return userIds;
  }
}

export default SocketService;