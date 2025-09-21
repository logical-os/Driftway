import { v4 as uuidv4 } from 'uuid';
import { ConversationKey } from '../models/Conversation';
import { databaseService } from '../database/DatabaseService';

export class ConversationKeyService {
    private static instance: ConversationKeyService;

    constructor() {
        // Using the singleton database service instance
    }

    public static getInstance(): ConversationKeyService {
        if (!ConversationKeyService.instance) {
            ConversationKeyService.instance = new ConversationKeyService();
        }
        return ConversationKeyService.instance;
    }

    /**
     * Create a new encryption key for a conversation
     * @param conversationId - The conversation ID
     * @param keyBundle - Base64 encoded key bundle containing the encryption key
     * @param createdBy - User ID who created the key
     * @returns Promise<ConversationKey>
     */
    public async createConversationKey(
        conversationId: string,
        keyBundle: string,
        createdBy: string
    ): Promise<ConversationKey> {
        try {
            const keyId = `key-${uuidv4()}`;

            // Deactivate any existing keys for this conversation
            await databaseService.run(
                'UPDATE conversation_keys SET is_active = 0 WHERE conversation_id = ?',
                [conversationId]
            );

            // Insert the new key
            await databaseService.run(
                `INSERT INTO conversation_keys 
                 (id, conversation_id, key_bundle, created_by, is_active) 
                 VALUES (?, ?, ?, ?, 1)`,
                [keyId, conversationId, keyBundle, createdBy]
            );

            // Update the conversation to reference this key
            await databaseService.run(
                'UPDATE conversations SET encryption_key_id = ?, is_encrypted = 1 WHERE id = ?',
                [keyId, conversationId]
            );

            return {
                id: keyId,
                conversationId,
                keyBundle,
                createdBy,
                createdAt: new Date(),
                isActive: true
            };
        } catch (error) {
            console.error('Error creating conversation key:', error);
            throw new Error('Failed to create conversation encryption key');
        }
    }

    /**
     * Get the active encryption key for a conversation
     * @param conversationId - The conversation ID
     * @returns Promise<ConversationKey | null>
     */
    public async getActiveConversationKey(conversationId: string): Promise<ConversationKey | null> {
        try {
            const result = await databaseService.get(
                `SELECT id, conversation_id, key_bundle, created_by, created_at, is_active
                 FROM conversation_keys 
                 WHERE conversation_id = ? AND is_active = 1
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [conversationId]
            );

            if (!result) {
                return null;
            }

            return {
                id: result.id,
                conversationId: result.conversation_id,
                keyBundle: result.key_bundle,
                createdBy: result.created_by,
                createdAt: new Date(result.created_at),
                isActive: Boolean(result.is_active)
            };
        } catch (error) {
            console.error('Error retrieving conversation key:', error);
            return null;
        }
    }

    /**
     * Check if a conversation has encryption enabled
     * @param conversationId - The conversation ID
     * @returns Promise<boolean>
     */
    public async isConversationEncrypted(conversationId: string): Promise<boolean> {
        try {
            const result = await databaseService.get(
                'SELECT is_encrypted FROM conversations WHERE id = ?',
                [conversationId]
            );

            return result ? Boolean(result.is_encrypted) : false;
        } catch (error) {
            console.error('Error checking conversation encryption status:', error);
            return false;
        }
    }

    /**
     * Rotate the encryption key for a conversation
     * @param conversationId - The conversation ID
     * @param newKeyBundle - New base64 encoded key bundle
     * @param rotatedBy - User ID who rotated the key
     * @returns Promise<ConversationKey>
     */
    public async rotateConversationKey(
        conversationId: string,
        newKeyBundle: string,
        rotatedBy: string
    ): Promise<ConversationKey> {
        return this.createConversationKey(conversationId, newKeyBundle, rotatedBy);
    }

    /**
     * Get all conversation keys for a user (for conversations they participate in)
     * @param userId - The user ID
     * @returns Promise<ConversationKey[]>
     */
    public async getUserConversationKeys(userId: string): Promise<ConversationKey[]> {
        try {
            const results = await databaseService.all(
                `SELECT ck.id, ck.conversation_id, ck.key_bundle, ck.created_by, ck.created_at, ck.is_active
                 FROM conversation_keys ck
                 INNER JOIN conversation_participants cp ON ck.conversation_id = cp.conversation_id
                 WHERE cp.user_id = ? AND ck.is_active = 1
                 ORDER BY ck.created_at DESC`,
                [userId]
            );

            return results.map((row: any) => ({
                id: row.id,
                conversationId: row.conversation_id,
                keyBundle: row.key_bundle,
                createdBy: row.created_by,
                createdAt: new Date(row.created_at),
                isActive: Boolean(row.is_active)
            }));
        } catch (error) {
            console.error('Error retrieving user conversation keys:', error);
            return [];
        }
    }

    /**
     * Remove encryption from a conversation (disable E2E)
     * @param conversationId - The conversation ID
     * @returns Promise<boolean>
     */
    public async disableConversationEncryption(conversationId: string): Promise<boolean> {
        try {
            // Deactivate all keys for this conversation
            await databaseService.run(
                'UPDATE conversation_keys SET is_active = 0 WHERE conversation_id = ?',
                [conversationId]
            );

            // Update conversation to disable encryption
            await databaseService.run(
                'UPDATE conversations SET encryption_key_id = NULL, is_encrypted = 0 WHERE id = ?',
                [conversationId]
            );

            return true;
        } catch (error) {
            console.error('Error disabling conversation encryption:', error);
            return false;
        }
    }
}

// Create and export service instance
export const conversationKeyService = ConversationKeyService.getInstance();
export default ConversationKeyService;