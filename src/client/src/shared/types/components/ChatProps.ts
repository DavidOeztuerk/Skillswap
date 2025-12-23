/**
 * Chat Component Props
 *
 * Specialized prop types for chat-related components.
 * Extends CommonProps for consistency.
 */

import type { SxProps, Theme } from '@mui/material';
import type {
  ChatMessageModel,
  ChatThreadListItem,
  TypingIndicator,
} from '../../../features/chat/types/Chat';
import type { ChatE2EEStatus } from '../../../features/videocall/hooks/types';

// ============================================================================
// Message Props
// ============================================================================

/**
 * Props for chat message bubble components
 */
export interface ChatMessageBubbleProps {
  /** The message to display */
  message: ChatMessageModel;
  /** Whether this is the current user's message */
  isOwn: boolean;
  /** Whether to show the sender's avatar */
  showAvatar: boolean;
  /** Current user's ID for reaction highlighting */
  currentUserId: string;
}

/**
 * Props for message reactions display
 */
export interface MessageReactionsProps {
  /** Reactions data - JSON string or parsed object */
  reactions?: string | Record<string, string[]>;
  /** Current user's ID */
  currentUserId: string;
  /** Message ID for toggling reactions */
  messageId: string;
}

/**
 * Props for code block display
 */
export interface CodeBlockProps {
  /** The code to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
}

/**
 * Props for reply preview
 */
export interface ReplyPreviewProps {
  /** The message being replied to */
  replyToMessage: ChatMessageModel;
  /** Maximum content length */
  maxLength?: number;
}

/**
 * Props for message action buttons
 */
export interface MessageActionsProps {
  /** The message this action bar belongs to */
  message: ChatMessageModel;
  /** Whether this is the current user's message */
  isOwn: boolean;
  /** Whether the actions are visible */
  visible: boolean;
}

// ============================================================================
// Thread Props
// ============================================================================

/**
 * Props for chat thread list item
 */
export interface ChatThreadItemProps {
  /** Thread data */
  thread: ChatThreadListItem;
  /** Whether this thread is selected */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
}

/**
 * Props for chat thread list
 */
export interface ChatThreadListProps {
  /** List of threads to display */
  threads: ChatThreadListItem[];
  /** Currently selected thread ID */
  selectedThreadId?: string | null;
  /** Handler when a thread is selected */
  onThreadSelect: (threadId: string) => void;
  /** Whether threads are loading */
  isLoading?: boolean;
  /** Search/filter term */
  searchTerm?: string;
}

// ============================================================================
// Panel Props
// ============================================================================

/**
 * Props for inline chat panel (embedded in pages)
 */
export interface InlineChatPanelProps {
  /** Chat partner's user ID */
  partnerId: string;
  /** Chat partner's display name */
  partnerName: string;
  /** Chat partner's avatar URL */
  partnerAvatarUrl?: string;
  /** Related skill ID */
  skillId?: string;
  /** Related skill name */
  skillName?: string;
  /** Panel height */
  height?: number | string;
  /** Close handler */
  onClose?: () => void;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

/**
 * Props for chat conversation view
 */
export interface ChatConversationProps {
  /** Thread ID to display */
  threadId: string;
  /** Back button handler */
  onBack?: () => void;
}

/**
 * Props for chat drawer (sidebar)
 */
export interface ChatDrawerProps {
  /** Whether drawer is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Drawer width variant */
  width?: 'collapsed' | 'normal' | 'expanded';
}

// ============================================================================
// E2EE Props
// ============================================================================

/**
 * Props for E2EE status header
 */
export interface ChatE2EEStatusHeaderProps {
  /** E2EE status */
  status: ChatE2EEStatus;
  /** Whether E2EE is active */
  isActive: boolean;
  /** Count of encrypted messages */
  messagesEncrypted: number;
  /** Count of decrypted messages */
  messagesDecrypted: number;
  /** Count of verification failures */
  verificationFailures: number;
}

/**
 * Props for message E2EE indicator
 */
export interface MessageE2EEIndicatorProps {
  /** Whether message is encrypted */
  isEncrypted: boolean;
  /** Whether signature is verified */
  isVerified?: boolean;
  /** Display variant */
  variant?: 'icon' | 'badge';
}

// ============================================================================
// Input Props
// ============================================================================

/**
 * Props for chat message input
 */
export interface ChatMessageInputProps {
  /** Thread ID to send message to */
  threadId: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

// ============================================================================
// Indicator Props
// ============================================================================

/**
 * Props for typing indicator
 */
export interface TypingIndicatorProps {
  /** Typing indicator data */
  indicator?: TypingIndicator | null;
  /** Alternative: just the user name */
  userName?: string;
}

/**
 * Props for date separator
 */
export interface DateSeparatorProps {
  /** Date string to display */
  date: string;
}

// ============================================================================
// Composite Types
// ============================================================================

/**
 * Complete chat context for a session
 */
export interface ChatContext {
  /** Thread ID */
  threadId: string;
  /** Partner info */
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string;
  /** Skill context */
  skillId?: string;
  skillName?: string;
  /** Match context */
  matchId?: string;
}

/**
 * E2EE statistics for a chat session
 */
export interface ChatE2EEStats {
  status: ChatE2EEStatus;
  isActive: boolean;
  messagesEncrypted: number;
  messagesDecrypted: number;
  verificationFailures: number;
}
