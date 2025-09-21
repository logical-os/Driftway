import { v4 as uuidv4 } from 'uuid';
import { 
  Conversation, 
  CreateConversationRequest, 
  ConversationType, 
  ConversationWithLastMessage 
} from '../models';
import { databaseService } from '../database/DatabaseService';

class ConversationService {
  constructor() {
    console.log('ConversationService initialized - using SQLite database');
  }

  async getAllConversations(): Promise<Conversation[]> {
    const rows = await databaseService.all(`
      SELECT c.*,
             GROUP_CONCAT(cp.user_id) as participant_ids
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `);
    
    return rows.map(row => this.mapRowToConversation(row));
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const row = await databaseService.get(`
      SELECT c.*,
             GROUP_CONCAT(cp.user_id) as participant_ids
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);
    
    return row ? this.mapRowToConversation(row) : undefined;
  }

  async getConversationsForUser(userId: string): Promise<ConversationWithLastMessage[]> {
    const rows = await databaseService.all(`
      SELECT c.*,
             GROUP_CONCAT(cp.user_id) as participant_ids,
             m.id as last_message_id,
             m.content as last_message_content,
             m.sender_id as last_message_sender_id,
             m.timestamp as last_message_timestamp,
             m.message_type as last_message_type
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN messages m ON c.last_message_id = m.id
      LEFT JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE cp.user_id = ? AND c.is_archived = 0
      GROUP BY c.id
      ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC
    `, [userId]);

    return rows.map(row => this.mapRowToConversationWithLastMessage(row));
  }

  async createConversation(conversationData: CreateConversationRequest, createdBy?: string): Promise<Conversation> {
    // For direct messages, generate a name based on participants
    let name = conversationData.name;
    if (conversationData.type === ConversationType.DIRECT && !name) {
      name = 'Direct conversation';
    }

    // Ensure the creator is included in participants
    const participants = createdBy && !conversationData.participants.includes(createdBy)
      ? [...conversationData.participants, createdBy]
      : conversationData.participants;

    const conversationId = uuidv4();
    const now = new Date();

    await databaseService.transaction(async () => {
      // Insert conversation
      await databaseService.run(`
        INSERT INTO conversations (id, name, type, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        conversationId,
        name,
        conversationData.type,
        createdBy || participants[0],
        now.toISOString(),
        now.toISOString()
      ]);

      // Insert participants
      for (const participantId of participants) {
        await databaseService.run(`
          INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
          VALUES (?, ?, ?)
        `, [conversationId, participantId, now.toISOString()]);
      }
    });

    const conversation = await this.getConversationById(conversationId);
    return conversation!;
  }

  async addParticipant(conversationId: string, userId: string): Promise<Conversation | undefined> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      return undefined;
    }

    if (conversation.participants.includes(userId)) {
      return conversation; // User already in conversation
    }

    await databaseService.transaction(async () => {
      await databaseService.run(`
        INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [conversationId, userId]);

      await databaseService.run(`
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [conversationId]);
    });

    return await this.getConversationById(conversationId);
  }

  async removeParticipant(conversationId: string, userId: string): Promise<Conversation | undefined> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      return undefined;
    }

    await databaseService.transaction(async () => {
      await databaseService.run(`
        DELETE FROM conversation_participants 
        WHERE conversation_id = ? AND user_id = ?
      `, [conversationId, userId]);

      await databaseService.run(`
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [conversationId]);
    });

    return await this.getConversationById(conversationId);
  }

  async updateLastMessage(conversationId: string, messageId: string): Promise<void> {
    await databaseService.run(`
      UPDATE conversations 
      SET last_message_id = ?, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [messageId, conversationId]);
  }

  async archiveConversation(conversationId: string): Promise<Conversation | undefined> {
    await databaseService.run(`
      UPDATE conversations 
      SET is_archived = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [conversationId]);

    return await this.getConversationById(conversationId);
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const result = await databaseService.run('DELETE FROM conversations WHERE id = ?', [conversationId]);
    return result.changes !== undefined && result.changes > 0;
  }

  async findDirectConversation(userId1: string, userId2: string): Promise<Conversation | undefined> {
    const row = await databaseService.get(`
      SELECT c.*,
             GROUP_CONCAT(cp.user_id) as participant_ids
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.type = 'direct'
      GROUP BY c.id
      HAVING participant_ids LIKE '%' || ? || '%' AND participant_ids LIKE '%' || ? || '%'
        AND (LENGTH(participant_ids) - LENGTH(REPLACE(participant_ids, ',', '')) + 1) = 2
    `, [userId1, userId2]);

    return row ? this.mapRowToConversation(row) : undefined;
  }

  private mapRowToConversation(row: any): Conversation {
    const participants = row.participant_ids ? row.participant_ids.split(',') : [];
    
    return {
      id: row.id,
      name: row.name,
      type: row.type as ConversationType,
      participants,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastMessageId: row.last_message_id,
      lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : undefined,
      isArchived: row.is_archived === 1,
      // Add encryption fields
      encryptionKeyId: row.encryption_key_id || undefined,
      isEncrypted: row.is_encrypted === 1
    };
  }

  private mapRowToConversationWithLastMessage(row: any): ConversationWithLastMessage {
    const conversation = this.mapRowToConversation(row);
    
    const lastMessage = row.last_message_id ? {
      id: row.last_message_id,
      content: row.last_message_content,
      senderId: row.last_message_sender_id,
      timestamp: new Date(row.last_message_timestamp),
      messageType: row.last_message_type,
      isEncrypted: row.last_message_is_encrypted === 1,
      encryptionIV: row.last_message_encryption_iv || undefined
    } : undefined;

    return {
      ...conversation,
      lastMessage
    };
  }
}

export const conversationService = new ConversationService();
export default conversationService;