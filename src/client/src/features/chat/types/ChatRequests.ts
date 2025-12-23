/**
 * Chat API Request Types
 * Matches backend Contracts/Chat/Requests
 */

export interface GetChatThreadsRequest {
  searchTerm?: string;
  unreadOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface GetChatMessagesRequest {
  afterMessageId?: string;
  afterTimestamp?: string;
  searchTerm?: string;
  messageType?: string;
  context?: string;
  contextReferenceId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateChatThreadRequest {
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
}

export interface SendChatMessageRequest {
  content: string;
  messageType?: string;
  context?: string;
  contextReferenceId?: string;
  replyToMessageId?: string;
  codeLanguage?: string;
  giphyId?: string;
  gifUrl?: string;
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptionKeyId?: string;
  encryptionIV?: string;
}

export interface MarkMessagesAsReadRequest {
  beforeTimestamp?: string;
  messageId?: string;
}

export interface AddReactionRequest {
  emoji: string;
  remove?: boolean;
}

export interface UploadChatAttachmentRequest {
  threadId: string;
  file: File;
  isEncrypted?: boolean;
  encryptionKeyId?: string;
}
