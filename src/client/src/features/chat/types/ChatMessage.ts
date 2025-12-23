export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  sentAt: string;
  messageType: string;
  metadata?: string;
  // E2EE fields
  isEncrypted?: boolean;
  isVerified?: boolean;
}

export interface SendChatMessageRequest {
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType?: string;
  metadata?: string;
}
