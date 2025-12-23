/**
 * Chat E2EE Indicator Component
 *
 * Displays encryption status for chat messages.
 * Shows:
 * - Lock icon for encrypted messages
 * - Verification badge for signed messages
 * - Warning for unverified messages
 *
 * Can be used in any chat context (InlineChatPanel, ChatDrawer, etc.)
 */

import React, { type JSX } from 'react';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { Box, Tooltip, Chip, Typography } from '@mui/material';
import type { ChatE2EEStatus } from '../../videocall/hooks/types';

// Helper functions to reduce cognitive complexity
function getIconTooltip(isVerified: boolean | undefined): string {
  if (isVerified === undefined) return 'Ende-zu-Ende verschlüsselt';
  if (isVerified) return 'Verschlüsselt & Verifiziert';
  return 'Verschlüsselt (Signatur nicht verifiziert)';
}

function getBadgeTooltip(isVerified: boolean | undefined): string {
  if (isVerified === undefined) return 'Diese Nachricht ist Ende-zu-Ende verschlüsselt';
  if (isVerified) return 'Diese Nachricht ist Ende-zu-Ende verschlüsselt und digital signiert';
  return 'Diese Nachricht ist verschlüsselt, aber die Signaturverifizierung ist fehlgeschlagen';
}

function buildStatsTooltip(encrypted: number, decrypted: number, failures: number): string {
  const base = `Verschlüsselt: ${encrypted}, Entschlüsselt: ${decrypted}`;
  if (failures > 0) {
    return `${base}, Verifizierungsfehler: ${failures}`;
  }
  return base;
}

function buildVerifiedTooltip(fingerprint: string | undefined): string {
  if (fingerprint === undefined) return 'Absender verifiziert';
  return `Absender verifiziert (${fingerprint.slice(0, 8)}...)`;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Props for inline message encryption indicator
 */
export interface MessageE2EEIndicatorProps {
  /** Whether message is encrypted */
  isEncrypted: boolean;
  /** Whether signature is verified (for received messages) */
  isVerified?: boolean;
  /** Show as small icon (inline with message) or badge */
  variant?: 'icon' | 'badge';
}

/**
 * Props for chat panel E2EE status header
 */
export interface ChatE2EEStatusHeaderProps {
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
 * Props for verification badge (for message sender)
 */
export interface VerificationBadgeProps {
  /** Whether sender is verified */
  isVerified: boolean;
  /** Sender's fingerprint */
  senderFingerprint?: string;
}

// ============================================================================
// Components
// ============================================================================

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
      <Tooltip title={getIconTooltip(isVerified)} arrow>
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
    <Tooltip title={getBadgeTooltip(isVerified)} arrow>
      <Chip
        icon={isVerified === false ? <WarningIcon /> : <ShieldIcon />}
        label={isVerified === false ? 'Nicht verifiziert' : 'Verschlüsselt'}
        size="small"
        color={isVerified === false ? 'warning' : 'success'}
        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
      />
    </Tooltip>
  );
};

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
      case 'initializing':
        return 'default';
      default: {
        const _exhaustiveCheck: never = status;
        return _exhaustiveCheck;
      }
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'initializing':
        return 'Verschlüsselung wird initialisiert...';
      case 'active':
        return 'Nachrichten sind verschlüsselt';
      case 'error':
        return 'Verschlüsselungsfehler';
      default: {
        const _exhaustiveCheck: never = status;
        return _exhaustiveCheck;
      }
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
      case 'initializing':
        return <LockOpenIcon fontSize="small" />;
      default: {
        const _exhaustiveCheck: never = status;
        return _exhaustiveCheck;
      }
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

      {isActive ? (
        <Tooltip
          title={buildStatsTooltip(messagesEncrypted, messagesDecrypted, verificationFailures)}
          arrow
        >
          <Chip
            icon={<ShieldIcon />}
            label={`${messagesEncrypted + messagesDecrypted} Nachr.`}
            size="small"
            color={getStatusColor()}
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        </Tooltip>
      ) : null}

      {verificationFailures > 0 && (
        <Tooltip title="Einige Nachrichten konnten nicht verifiziert werden" arrow>
          <WarningIcon fontSize="small" color="warning" />
        </Tooltip>
      )}
    </Box>
  );
};

/**
 * Verification badge (shows sender verification status)
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  senderFingerprint,
}) => {
  if (!isVerified) {
    return (
      <Tooltip title="Absenderidentität konnte nicht verifiziert werden" arrow>
        <WarningIcon fontSize="small" color="warning" sx={{ ml: 0.5 }} />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={buildVerifiedTooltip(senderFingerprint)} arrow>
      <VerifiedIcon fontSize="small" color="success" sx={{ ml: 0.5 }} />
    </Tooltip>
  );
};

export default MessageE2EEIndicator;
