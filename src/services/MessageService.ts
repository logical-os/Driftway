import { v4 as uuidv4 } from 'uuid';
import { 
  Message, 
  SendMessageRequest, 
  EditMessageRequest, 
  MessageType, 
  MessageRead 
} from '../models';
import { databaseService } from '../database/DatabaseService';

class MessageService {
  async getAllMessages(): Promise<Message[]> {
    const rows = await databaseService.all(`
      SELECT m.*, 
             GROUP_CONCAT(mr.user_id || ':' || mr.read_at) as read_by_data
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id
      WHERE m.is_deleted = 0
      GROUP BY m.id
      ORDER BY m.timestamp ASC
    `);
    
    return rows.map(row => this.mapRowToMessage(row));
  }

  async getMessageById(id: string): Promise<Message | undefined> {
    const row = await databaseService.get(`
      SELECT m.*, 
             GROUP_CONCAT(mr.user_id || ':' || mr.read_at) as read_by_data
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id
      WHERE m.id = ?
      GROUP BY m.id
    `, [id]);
    
    return row ? this.mapRowToMessage(row) : undefined;
  }

  async getMessagesByConversation(conversationId: string, limit?: number, offset?: number): Promise<Message[]> {
    let query = `
      SELECT m.*, 
             GROUP_CONCAT(mr.user_id || ':' || mr.read_at) as read_by_data
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id
      WHERE m.conversation_id = ? AND m.is_deleted = 0
      GROUP BY m.id
      ORDER BY m.timestamp ASC
    `;
    
    const params: any[] = [conversationId];
    
    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }
    
    const rows = await databaseService.all(query, params);
    return rows.map(row => this.mapRowToMessage(row));
  }

  async createMessage(messageData: SendMessageRequest, senderId: string): Promise<Message> {
    const messageId = uuidv4();
    const timestamp = new Date();
    
    await databaseService.transaction(async () => {
      // Determine if we're storing encrypted content
      const content = messageData.encryptedContent || messageData.content;
      const isEncrypted = Boolean(messageData.encryptedContent);
      
      // Insert the message with encryption support
      await databaseService.run(`
        INSERT INTO messages (id, conversation_id, sender_id, content, message_type, timestamp, encryption_iv, is_encrypted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        messageId,
        messageData.conversationId,
        senderId,
        content, // This will be encrypted content if available, otherwise plaintext
        messageData.messageType || MessageType.TEXT,
        timestamp.toISOString(),
        messageData.encryptionIV || null,
        isEncrypted ? 1 : 0
      ]);
      
      // Mark as read by sender
      await databaseService.run(`
        INSERT INTO message_reads (message_id, user_id, read_at)
        VALUES (?, ?, ?)
      `, [messageId, senderId, timestamp.toISOString()]);
      
      // Update conversation's last message
      await databaseService.run(`
        UPDATE conversations 
        SET last_message_id = ?, last_message_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [messageId, timestamp.toISOString(), messageData.conversationId]);
    });

    const message = await this.getMessageById(messageId);
    return message!;
  }

  async editMessage(messageId: string, userId: string, editData: EditMessageRequest): Promise<Message | undefined> {
    const message = await this.getMessageById(messageId);
    if (!message || message.senderId !== userId || message.isDeleted) {
      return undefined;
    }

    const editedAt = new Date();
    
    // Handle encrypted content if provided
    const content = editData.encryptedContent || editData.content;
    const encryptionIV = editData.encryptionIV;
    
    await databaseService.run(`
      UPDATE messages 
      SET content = ?, edited_at = ?, encryption_iv = ?
      WHERE id = ?
    `, [content, editedAt.toISOString(), encryptionIV, messageId]);

    return await this.getMessageById(messageId);
  }

  async deleteMessage(messageId: string, userId: string): Promise<Message | undefined> {
    const message = await this.getMessageById(messageId);
    if (!message || message.senderId !== userId) {
      return undefined;
    }

    await databaseService.run(`
      UPDATE messages 
      SET is_deleted = 1
      WHERE id = ?
    `, [messageId]);

    return await this.getMessageById(messageId);
  }

  async markAsRead(messageId: string, userId: string): Promise<Message | undefined> {
    const message = await this.getMessageById(messageId);
    if (!message) {
      return undefined;
    }

    // Check if user already read this message
    const existingRead = message.readBy.find(read => read.userId === userId);
    if (existingRead) {
      return message; // Already marked as read
    }

    await databaseService.run(`
      INSERT OR IGNORE INTO message_reads (message_id, user_id, read_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [messageId, userId]);

    return await this.getMessageById(messageId);
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<Message[]> {
    const conversationMessages = await this.getMessagesByConversation(conversationId);
    const updatedMessages: Message[] = [];

    for (const message of conversationMessages) {
      const hasRead = message.readBy.some(read => read.userId === userId);
      if (!hasRead) {
        const updatedMessage = await this.markAsRead(message.id, userId);
        if (updatedMessage) {
          updatedMessages.push(updatedMessage);
        }
      }
    }

    return updatedMessages;
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const result = await databaseService.get(`
      SELECT COUNT(*) as count
      FROM messages m
      WHERE m.conversation_id = ? 
        AND m.sender_id != ? 
        AND m.is_deleted = 0
        AND m.id NOT IN (
          SELECT message_id 
          FROM message_reads 
          WHERE user_id = ?
        )
    `, [conversationId, userId, userId]);
    
    return result ? result.count : 0;
  }

  async getLatestMessageInConversation(conversationId: string): Promise<Message | undefined> {
    const row = await databaseService.get(`
      SELECT m.*, 
             GROUP_CONCAT(mr.user_id || ':' || mr.read_at) as read_by_data
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id
      WHERE m.conversation_id = ? AND m.is_deleted = 0
      GROUP BY m.id
      ORDER BY m.timestamp DESC
      LIMIT 1
    `, [conversationId]);
    
    return row ? this.mapRowToMessage(row) : undefined;
  }

  async searchMessages(query: string, conversationId?: string): Promise<Message[]> {
    let sql = `
      SELECT m.*, 
             GROUP_CONCAT(mr.user_id || ':' || mr.read_at) as read_by_data
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id
      WHERE m.is_deleted = 0 
        AND m.content LIKE ?
    `;
    
    const params: any[] = [`%${query}%`];
    
    if (conversationId) {
      sql += ' AND m.conversation_id = ?';
      params.push(conversationId);
    }
    
    sql += ' GROUP BY m.id ORDER BY m.timestamp DESC';
    
    const rows = await databaseService.all(sql, params);
    return rows.map(row => this.mapRowToMessage(row));
  }

  private mapRowToMessage(row: any): Message {
    const readBy: MessageRead[] = [];
    
    if (row.read_by_data) {
      const readEntries = row.read_by_data.split(',');
      for (const entry of readEntries) {
        const [userId, readAt] = entry.split(':');
        if (userId && readAt) {
          readBy.push({
            userId,
            readAt: new Date(readAt)
          });
        }
      }
    }

    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      messageType: row.message_type as MessageType,
      timestamp: new Date(row.timestamp),
      editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
      isDeleted: row.is_deleted === 1,
      readBy,
      // Add encryption fields
      encryptionIV: row.encryption_iv || undefined,
      isEncrypted: row.is_encrypted === 1
    };
  }
}

export const messageService = new MessageService();
export default messageService;