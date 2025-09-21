export interface Conversation {
  id: string;
  name?: string;
  type: ConversationType;
  participants: string[]; // Array of user IDs
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageId?: string;
  lastMessageAt?: Date;
  isArchived: boolean;
  // Encryption support
  encryptionKeyId?: string; // Reference to the encryption key for this conversation
  isEncrypted: boolean; // Flag to indicate if conversation uses E2E encryption
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel'
}

export interface CreateConversationRequest {
  name?: string;
  type: ConversationType;
  participants: string[];
  enableEncryption?: boolean; // Option to enable E2E encryption
}

export interface ConversationWithLastMessage extends Conversation {
  lastMessage?: {
    id: string;
    content: string; // This will be encrypted content
    senderId: string;
    timestamp: Date;
    messageType: string;
    isEncrypted: boolean;
    encryptionIV?: string;
  };
  unreadCount?: number;
}

// New interface for managing conversation encryption keys
export interface ConversationKey {
  id: string;
  conversationId: string;
  keyBundle: string; // Base64 encoded encrypted key bundle
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}