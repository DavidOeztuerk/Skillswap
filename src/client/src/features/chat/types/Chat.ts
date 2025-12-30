/**
 * Chat System Types
 * Microsoft Teams-style thread-based chat system
 */

// ============================================================================
// Enums / Constants
// ============================================================================

export const ChatMessageType = {
  Text: 'Text',
  Image: 'Image',
  File: 'File',
  System: 'System',
  CodeBlock: 'CodeBlock',
  GIF: 'GIF',
  Emoji: 'Emoji',
  Link: 'Link',
} as const;

export type ChatMessageTypeValue = (typeof ChatMessageType)[keyof typeof ChatMessageType];

export const ChatMessageContext = {
  Direct: 'Direct',
  MatchRequest: 'MatchRequest',
  Match: 'Match',
  Appointment: 'Appointment',
  VideoCall: 'VideoCall',
} as const;

export type ChatMessageContextValue = (typeof ChatMessageContext)[keyof typeof ChatMessageContext];

export const ThreadLockReason = {
  SessionsCompleted: 'SessionsCompleted',
  MatchDissolved: 'MatchDissolved',
  ManualLock: 'ManualLock',
  UserBlocked: 'UserBlocked',
  Violation: 'Violation',
} as const;

export type ThreadLockReasonValue = (typeof ThreadLockReason)[keyof typeof ThreadLockReason];

/**
 * E2EE status for chat UI display
 */
export type ChatE2EEStatus = 'disabled' | 'initializing' | 'active' | 'error';

// ============================================================================
// Core Chat Models
// ============================================================================

export interface ChatThread {
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
  lockReason?: ThreadLockReasonValue;
  otherParticipantIsTyping: boolean;
  createdAt: string;
  // Computed for current user by backend
  otherParticipantId?: string;
  otherParticipantName?: string;
  otherParticipantAvatarUrl?: string;
  // Local state (not from backend)
  isTyping?: boolean;
}

export interface ChatMessageModel {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  messageType: ChatMessageTypeValue;
  context: ChatMessageContextValue;
  contextReferenceId?: string;
  replyToMessageId?: string;
  replyToMessage?: ChatMessageModel;
  codeLanguage?: string;
  giphyId?: string;
  gifUrl?: string;
  isEncrypted: boolean;
  encryptedContent?: string;
  encryptionKeyId?: string;
  encryptionIV?: string;
  attachmentId?: string;
  attachment?: ChatAttachment;
  reactionsJson?: string;
  reactions?: Record<string, string[]>;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatAttachment {
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

// ============================================================================
// UI State Models
// ============================================================================

export interface ChatThreadListItem {
  threadId: string;
  otherParticipantId: string;
  otherParticipantName?: string;
  otherParticipantAvatarUrl?: string;
  skillName?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  isLastMessageFromMe: boolean;
  unreadCount: number;
  isLocked: boolean;
  isTyping: boolean;
  isOnline?: boolean;
}

export interface ChatState {
  threads: ChatThreadListItem[];
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  messages: Record<string, ChatMessageModel[]>;
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  error: string | null;
  totalUnreadCount: number;
  hasMoreMessages: Record<string, boolean>;
  typingUsers: Record<string, TypingIndicator>;
  onlineUsers: Set<string>;
  messageReplyTo: ChatMessageModel | null;
  editingMessage: ChatMessageModel | null;
  isDrawerOpen: boolean;
  drawerWidth: 'collapsed' | 'normal' | 'expanded';
}

export interface TypingIndicator {
  threadId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: number;
}

// ============================================================================
// Unread Count Models
// ============================================================================

export interface ThreadUnreadCount {
  threadId: string;
  unreadCount: number;
  lastMessageAt?: string;
}

export interface ChatUnreadCountResult {
  totalUnreadCount: number;
  threadUnreadCounts: ThreadUnreadCount[];
}

// ============================================================================
// Message Reactions
// ============================================================================

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface ParsedReactions {
  reactions: MessageReaction[];
  userReactions: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse reactions from either string (legacy) or object (new backend format)
 * @param reactionsData - Either a JSON string or a parsed object
 * @param currentUserId - The current user's ID to determine user reactions
 */
export function parseReactions(
  reactionsData: string | Record<string, string[]> | undefined | null,
  currentUserId: string
): ParsedReactions {
  if (reactionsData === undefined || reactionsData === null) {
    return { reactions: [], userReactions: [] };
  }

  try {
    // Handle both string (legacy) and object (new format) inputs
    const parsed: Record<string, string[]> =
      typeof reactionsData === 'string'
        ? (JSON.parse(reactionsData) as Record<string, string[]>)
        : reactionsData;

    const reactions: MessageReaction[] = [];
    const userReactions: string[] = [];

    for (const [emoji, userIds] of Object.entries(parsed)) {
      reactions.push({
        emoji,
        userIds,
        count: userIds.length,
      });
      if (userIds.includes(currentUserId)) {
        userReactions.push(emoji);
      }
    }

    return { reactions, userReactions };
  } catch {
    return { reactions: [], userReactions: [] };
  }
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function getThreadDisplayInfo(
  thread: ChatThread,
  currentUserId: string
): ChatThreadListItem {
  // Use backend-computed fields if available, otherwise fall back to manual calculation
  const isParticipant1 = thread.participant1Id === currentUserId;

  const otherParticipantId =
    thread.otherParticipantId ?? (isParticipant1 ? thread.participant2Id : thread.participant1Id);
  const otherParticipantName =
    thread.otherParticipantName ??
    (isParticipant1 ? thread.participant2Name : thread.participant1Name) ??
    '';
  const otherParticipantAvatarUrl =
    thread.otherParticipantAvatarUrl ??
    (isParticipant1 ? thread.participant2AvatarUrl : thread.participant1AvatarUrl);

  return {
    threadId: thread.threadId,
    otherParticipantId,
    otherParticipantName,
    otherParticipantAvatarUrl,
    skillName: thread.skillName,
    lastMessageAt: thread.lastMessageAt,
    lastMessagePreview: thread.lastMessagePreview,
    isLastMessageFromMe: thread.lastMessageSenderId === currentUserId,
    unreadCount: thread.unreadCount,
    isLocked: thread.isLocked,
    isTyping: thread.isTyping ?? thread.otherParticipantIsTyping,
  };
}

export function truncateMessage(message: string, maxLength = 50): string {
  if (message.length <= maxLength) return message;
  return `${message.slice(0, Math.max(0, maxLength - 3))}...`;
}

// ============================================================================
// File Type Helpers
// ============================================================================

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
];

export const ALLOWED_CODE_TYPES = [
  'text/javascript',
  'application/javascript',
  'text/typescript',
  'application/typescript',
  'text/x-python',
  'text/x-java',
  'text/x-csharp',
  'text/x-c',
  'text/x-cpp',
  'application/json',
  'text/html',
  'text/css',
  'text/xml',
  'application/xml',
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function isAllowedFileType(mimeType: string): boolean {
  return (
    ALLOWED_IMAGE_TYPES.includes(mimeType) ||
    ALLOWED_DOCUMENT_TYPES.includes(mimeType) ||
    ALLOWED_CODE_TYPES.includes(mimeType)
  );
}

export function getFileTypeCategory(mimeType: string): 'image' | 'document' | 'code' | 'unknown' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  if (ALLOWED_CODE_TYPES.includes(mimeType)) return 'code';
  return 'unknown';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = Number.parseFloat((bytes / k ** i).toFixed(2));
  const unit = sizes[i] ?? 'Bytes';
  return `${size.toString()} ${unit}`;
}
