/**
 * Chat E2EE Indicator Component
 *
 * Displays encryption status for chat messages in the video call chat panel.
 * Shows:
 * - Lock icon for encrypted messages
 * - Verification badge for signed messages
 * - Warning for unverified messages
 */

import React, { type JSX } from 'react';
import { Box, Tooltip, Chip, Typography } from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import type { ChatE2EEStatus } from '../../store/adapters/videoCallAdapter+State';

/**
 * Props for inline message encryption indicator
 */
interface MessageE2EEIndicatorProps {
  /** Whether message is encrypted */
  isEncrypted: boolean;
  /** Whether signature is verified (for received messages) */
  isVerified?: boolean;
  /** Show as small icon (inline with message) or badge */
  variant?: 'icon' | 'badge';
}

/**
 * Inline message encryption indicator (per message)
 */
export const MessageE2EEIndicator: React.FC<MessageE2EEIndicatorProps> = ({
  isEncrypted,
  isVerified,
  variant = 'icon',
}) => {
  if (!isEncrypted) {
    return null; // Don't show anything for unencrypted messages
  }

  if (variant === 'icon') {
    // Small icon next to message
    return (
      <Tooltip
        title={
          isVerified !== undefined
            ? isVerified
              ? 'Encrypted & Verified'
              : 'Encrypted (Unverified Signature)'
            : 'Encrypted'
        }
        arrow
      >
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            ml: 0.5,
            color: isVerified === false ? 'warning.main' : 'success.main',
          }}
        >
          {isVerified === false ? (
            <WarningIcon fontSize="small" sx={{ fontSize: 14 }} />
          ) : (
            <LockIcon fontSize="small" sx={{ fontSize: 14 }} />
          )}
        </Box>
      </Tooltip>
    );
  }

  // Badge variant (larger, more prominent)
  return (
    <Tooltip
      title={
        isVerified !== undefined
          ? isVerified
            ? 'This message is end-to-end encrypted and digitally signed'
            : 'This message is encrypted but signature verification failed'
          : 'This message is end-to-end encrypted'
      }
      arrow
    >
      <Chip
        icon={isVerified === false ? <WarningIcon /> : <ShieldIcon />}
        label={isVerified === false ? 'Unverified' : 'Encrypted'}
        size="small"
        color={isVerified === false ? 'warning' : 'success'}
        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
      />
    </Tooltip>
  );
};

/**
 * Props for chat panel E2EE status header
 */
interface ChatE2EEStatusHeaderProps {
  /** E2EE status */
  status: ChatE2EEStatus;
  /** Whether E2EE is active */
  isActive: boolean;
  /** Number of encrypted messages */
  messagesEncrypted: number;
  /** Number of decrypted messages */
  messagesDecrypted: number;
  /** Number of verification failures */
  verificationFailures: number;
}

/**
 * Chat panel E2EE status header (at top of chat panel)
 */
export const ChatE2EEStatusHeader: React.FC<ChatE2EEStatusHeaderProps> = ({
  status,
  isActive,
  messagesEncrypted,
  messagesDecrypted,
  verificationFailures,
}) => {
  if (status === 'disabled') {
    return null; // Don't show if E2EE is disabled
  }

  const getStatusColor = (): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return verificationFailures > 0 ? 'warning' : 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'initializing':
        return 'Initializing encryption...';
      case 'active':
        return 'Messages are encrypted';
      case 'error':
        return 'Encryption error';
      default:
        return 'Not encrypted';
    }
  };

  const getStatusIcon = (): JSX.Element => {
    switch (status) {
      case 'active':
        return verificationFailures > 0 ? (
          <WarningIcon fontSize="small" />
        ) : (
          <LockIcon fontSize="small" />
        );
      case 'error':
        return <LockOpenIcon fontSize="small" />;
      default:
        return <LockOpenIcon fontSize="small" />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        backgroundColor: `${getStatusColor()}.light`,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getStatusIcon()}
        <Typography variant="caption" fontWeight="medium">
          {getStatusText()}
        </Typography>
      </Box>

      {isActive && (
        <Tooltip
          title={`Encrypted: ${String(messagesEncrypted)}, Decrypted: ${String(messagesDecrypted)}${
            verificationFailures > 0
              ? `, Verification failures: ${String(verificationFailures)}`
              : ''
          }`}
          arrow
        >
          <Chip
            icon={<ShieldIcon />}
            label={`${String(messagesEncrypted + messagesDecrypted)} msgs`}
            size="small"
            color={getStatusColor()}
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        </Tooltip>
      )}

      {verificationFailures > 0 && (
        <Tooltip title="Some messages failed signature verification" arrow>
          <WarningIcon fontSize="small" color="warning" />
        </Tooltip>
      )}
    </Box>
  );
};

/**
 * Props for verification badge (for message sender)
 */
interface VerificationBadgeProps {
  /** Whether sender is verified */
  isVerified: boolean;
  /** Sender's fingerprint */
  senderFingerprint?: string;
}

/**
 * Verification badge (shows sender verification status)
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  senderFingerprint,
}) => {
  if (!isVerified) {
    return (
      <Tooltip title="Sender identity could not be verified" arrow>
        <WarningIcon fontSize="small" color="warning" sx={{ ml: 0.5 }} />
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={`Sender verified${senderFingerprint ? ` (${senderFingerprint.substring(0, 8)}...)` : ''}`}
      arrow
    >
      <VerifiedIcon fontSize="small" color="success" sx={{ ml: 0.5 }} />
    </Tooltip>
  );
};

export default MessageE2EEIndicator;
