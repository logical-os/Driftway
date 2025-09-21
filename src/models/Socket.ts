// Socket.IO event types
export interface SocketEvents {
  // Client to Server events
  'join-conversation': (conversationId: string) => void;
  'leave-conversation': (conversationId: string) => void;
  'send-message': (data: SendMessageSocketData) => void;
  'typing-start': (conversationId: string) => void;
  'typing-stop': (conversationId: string) => void;
  'mark-as-read': (data: MarkAsReadData) => void;

  // Server to Client events
  'message-received': (message: any) => void;
  'user-joined': (data: UserActivityData) => void;
  'user-left': (data: UserActivityData) => void;
  'user-typing': (data: TypingData) => void;
  'user-stopped-typing': (data: TypingData) => void;
  'message-read': (data: MessageReadData) => void;
  'error': (error: SocketError) => void;
}

export interface SendMessageSocketData {
  conversationId: string;
  content: string;
  messageType?: string;
  // Encryption support
  encryptedContent?: string;
  encryptionIV?: string;
}

export interface UserActivityData {
  userId: string;
  conversationId: string;
  username: string;
}

export interface TypingData {
  userId: string;
  conversationId: string;
  username: string;
}

export interface MarkAsReadData {
  conversationId: string;
  messageId: string;
}

export interface MessageReadData {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface SocketError {
  message: string;
  code?: string;
}

export interface AuthenticatedSocket {
  userId: string;
  username: string;
}