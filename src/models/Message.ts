export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string; // This will store encrypted content on server
  messageType: MessageType;
  timestamp: Date;
  editedAt?: Date;
  isDeleted: boolean;
  readBy: MessageRead[];
  // Encryption metadata
  encryptionIV?: string; // Initialization vector for decryption
  isEncrypted: boolean; // Flag to indicate if message is encrypted
}

export interface MessageRead {
  userId: string;
  readAt: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system'
}

export interface SendMessageRequest {
  conversationId: string;
  content: string; // Plaintext on client, will be encrypted before sending
  messageType?: MessageType;
  // Client-side encryption data (sent to server but not stored in plaintext)
  encryptedContent?: string; // The actual encrypted content
  encryptionIV?: string; // IV used for encryption
}

export interface EditMessageRequest {
  content: string; // Plaintext on client, will be encrypted before sending
  encryptedContent?: string; // The actual encrypted content
  encryptionIV?: string; // IV used for encryption
}