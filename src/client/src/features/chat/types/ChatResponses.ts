/**
 * Chat API Response Types
 * Matches backend Contracts/Chat/Responses
 */

export interface ChatThreadResponse {
  id: string;
  threadId: string;
  participant1Id: string;
  participant2Id: string;
  participant1Name: string;
  participant2Name: string;
  participant1AvatarUrl?: string;
  participant2AvatarUrl?: string;
  skillId?: string;
  skillName?: string;
  matchId?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSenderId?: string;
  participant1UnreadCount: number;
  participant2UnreadCount: number;
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: string;
  participant1LastReadAt?: string;
  participant2LastReadAt?: string;
  isTypingParticipant1: boolean;
  isTypingParticipant2: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessageResponse {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  messageType: string;
  context: string;
  contextReferenceId?: string;
  replyToMessageId?: string;
  replyToMessage?: ChatMessageResponse;
  codeLanguage?: string;
  giphyId?: string;
  gifUrl?: string;
  isEncrypted: boolean;
  encryptedContent?: string;
  encryptionKeyId?: string;
  encryptionIV?: string;
  attachmentId?: string;
  attachment?: ChatAttachmentResponse;
  // Reactions as parsed object from backend (matches C# Dictionary<string, List<string>>)
  reactions?: Record<string, string[]>;
  reactionCount?: number;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatAttachmentResponse {
  id: string;
  messageId: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  isVirusScanned: boolean;
  virusScanResult?: string;
  scannedAt?: string;
  isEncrypted: boolean;
  encryptionKeyId?: string;
  createdAt: string;
}

export interface ChatUnreadCountResponse {
  totalUnreadCount: number;
  threadUnreadCounts: ThreadUnreadCountItem[];
}

export interface ThreadUnreadCountItem {
  threadId: string;
  unreadCount: number;
  lastMessageAt?: string;
}
