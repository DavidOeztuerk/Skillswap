/**
 * Chat API Response Types
 * Matches backend Contracts/Chat/Responses
 */

export interface ChatThreadResponse {
  id: string;
  threadId: string;
  participant1Id: string;
  participant2Id: string;
  participant1Name?: string;
  participant2Name?: string;
  participant1AvatarUrl?: string;
  participant2AvatarUrl?: string;
  skillId?: string;
  skillName?: string;
  matchId?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSenderId?: string;
  // Backend provides single unread count for current user
  unreadCount: number;
  totalMessageCount: number;
  isLocked: boolean;
  lockReason?: string;
  otherParticipantIsTyping: boolean;
  createdAt: string;
  // Computed for current user by backend
  otherParticipantId?: string;
  otherParticipantName?: string;
  otherParticipantAvatarUrl?: string;
}

export interface ChatMessageResponse {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  renderedHtml?: string;
  messageType: string;
  context: string;
  contextReferenceId?: string;
  replyToMessageId?: string;
  replyToPreview?: string;
  replyToSenderName?: string;
  codeLanguage?: string;
  giphyId?: string;
  gifUrl?: string;
  // E2EE
  isEncrypted: boolean;
  encryptedContent?: string;
  encryptionKeyId?: string;
  encryptionIV?: string;
  // File attachments
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  fileSizeDisplay?: string;
  thumbnailUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  attachments?: ChatAttachmentResponse[];
  // Reactions as parsed object from backend (matches C# Dictionary<string, List<string>>)
  reactions?: Record<string, string[]>;
  reactionCount: number;
  // Status
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  isRead: boolean;
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
  // Computed by backend
  isMine: boolean;
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
