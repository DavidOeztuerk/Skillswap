import React, { useState, useMemo, type JSX } from 'react';
import {
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Fingerprint as FingerprintIcon,
  VpnKey as KeyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip,
  Divider,
  Alert,
  useTheme,
  type Theme,
} from '@mui/material';
import {
  type BrowserCapabilities,
  getBrowserCapabilities,
  getBrowserInfo,
} from '../../../shared/utils/browserDetection';
import type { E2EEStatus } from '../hooks/types';
import type { EncryptionStats } from '../store/videoCallAdapter+State';

// ============================================================================
// Constants
// ============================================================================

const TEXT_SECONDARY = 'text.secondary';
const JUSTIFY_SPACE_BETWEEN = 'space-between';
// eslint-disable-next-line sonarjs/no-duplicate-string -- Same literals required in switch cases for exhaustiveness
const TRANSITIONAL_STATES = new Set<E2EEStatus>(['initializing', 'key-exchange', 'key-rotation']);

// ============================================================================
// Types
// ============================================================================

interface E2EEDebugPanelProps {
  // Video E2EE
  status: E2EEStatus;
  localFingerprint: string | null;
  remoteFingerprint: string | null;
  keyGeneration: number;
  encryptionStats: EncryptionStats | null;
  errorMessage: string | null;
  onRotateKeys?: () => void;

  // Chat E2EE
  chatStatus: E2EEStatus;
  chatLocalFingerprint: string | null;
  chatStats: {
    messagesEncrypted: number;
    messagesDecrypted: number;
    verificationFailures: number;
  } | null;

  // Optional: Compact mode for smaller displays
  compact?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatFingerprint(fp: string | null): string {
  if (!fp) return '—';
  // Format: XXXX-XXXX-XXXX-XXXX
  const clean = fp.replaceAll(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length < 16) return fp;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}`;
}

function getStatusColor(status: E2EEStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'active':
      return 'success';
    case 'initializing':
    case 'key-exchange':
    case 'key-rotation':
      return 'info';
    case 'error':
      return 'error';
    case 'unsupported':
      return 'warning';
    case 'disabled':
      return 'default';
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

function getStatusIcon(status: E2EEStatus): JSX.Element {
  switch (status) {
    case 'active':
      return <CheckCircleIcon fontSize="small" />;
    case 'initializing':
    case 'key-exchange':
    case 'key-rotation':
      return <InfoIcon fontSize="small" />;
    case 'error':
      return <ErrorIcon fontSize="small" />;
    case 'unsupported':
      return <WarningIcon fontSize="small" />;
    case 'disabled':
      return <SecurityIcon fontSize="small" />;
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

function getStatusLabel(status: E2EEStatus): string {
  switch (status) {
    case 'disabled':
      return 'Deaktiviert';
    case 'initializing':
      return 'Initialisierung...';
    case 'key-exchange':
      return 'Schlüsselaustausch...';
    case 'active':
      return 'Aktiv';
    case 'key-rotation':
      return 'Schlüsselrotation...';
    case 'error':
      return 'Fehler';
    case 'unsupported':
      return 'Nicht unterstützt';
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

function getBorderColor(isActive: boolean, hasError: boolean, theme: Theme): string {
  if (isActive) return theme.palette.success.main;
  if (hasError) return theme.palette.error.main;
  return theme.palette.divider;
}

function getSecurityIconColor(
  isActive: boolean,
  hasError: boolean
): 'success' | 'error' | 'action' {
  if (isActive) return 'success';
  if (hasError) return 'error';
  return 'action';
}

function getHealthColor(health: number): 'success' | 'warning' | 'error' {
  if (health > 95) return 'success';
  if (health > 80) return 'warning';
  return 'error';
}

// ============================================================================
// Sub-Components
// ============================================================================

interface StatItemProps {
  label: string;
  value: number | string;
  color?: 'success' | 'error' | 'info' | 'warning';
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => {
  const theme = useTheme();
  const textColor = color === undefined ? 'text.primary' : `${color}.main`;

  return (
    <Box
      sx={{
        p: 0.75,
        bgcolor: theme.palette.action.hover,
        borderRadius: 0.5,
        textAlign: 'center',
      }}
    >
      <Typography
        variant="caption"
        color={TEXT_SECONDARY}
        sx={{ display: 'block', fontSize: '0.65rem' }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight="bold" color={textColor} sx={{ fontSize: '0.8rem' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Box>
  );
};

interface FingerprintDisplayProps {
  label: string;
  fingerprint: string | null;
  copyLabel: string;
  copied: string | null;
  onCopy: (text: string, label: string) => void;
  activeColor: string;
}

const FingerprintDisplay: React.FC<FingerprintDisplayProps> = ({
  label,
  fingerprint,
  copyLabel,
  copied,
  onCopy,
  activeColor,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 1, p: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: JUSTIFY_SPACE_BETWEEN, alignItems: 'center' }}>
        <Typography variant="caption" color={TEXT_SECONDARY}>
          {label}
        </Typography>
        {fingerprint ? (
          <Tooltip title={copied === copyLabel ? 'Kopiert!' : 'Kopieren'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(fingerprint, copyLabel);
              }}
            >
              <CopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
      <Typography
        variant="body2"
        fontFamily="monospace"
        fontWeight="bold"
        color={fingerprint ? activeColor : 'text.disabled'}
      >
        {formatFingerprint(fingerprint)}
      </Typography>
    </Box>
  );
};

interface EncryptionStatsSectionProps {
  encryptionStats: EncryptionStats;
  encryptionHealth: number | null;
}

const EncryptionStatsSection: React.FC<EncryptionStatsSectionProps> = ({
  encryptionStats,
  encryptionHealth,
}) => {
  const errorCount = encryptionStats.encryptionErrors + encryptionStats.decryptionErrors;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        color={TEXT_SECONDARY}
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <TimelineIcon fontSize="inherit" />
        Verschlüsselungs-Statistik
      </Typography>

      {encryptionHealth !== null && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: JUSTIFY_SPACE_BETWEEN, mb: 0.5 }}>
            <Typography variant="caption">Encryption Health</Typography>
            <Typography variant="caption" fontWeight="bold">
              {encryptionHealth.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={encryptionHealth}
            color={getHealthColor(encryptionHealth)}
            sx={{ height: 6, borderRadius: 1 }}
          />
        </Box>
      )}

      <Box
        sx={{
          mt: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          fontSize: '0.75rem',
        }}
      >
        <StatItem label="Frames gesamt" value={encryptionStats.totalFrames} />
        <StatItem label="Verschlüsselt" value={encryptionStats.encryptedFrames} color="success" />
        <StatItem label="Entschlüsselt" value={encryptionStats.decryptedFrames} color="info" />
        <StatItem label="Fehler" value={errorCount} color={errorCount > 0 ? 'error' : undefined} />
        <StatItem
          label="Ø Encrypt"
          value={`${encryptionStats.averageEncryptionTime.toFixed(2)}ms`}
        />
        <StatItem
          label="Ø Decrypt"
          value={`${encryptionStats.averageDecryptionTime.toFixed(2)}ms`}
        />
      </Box>

      {encryptionStats.lastKeyRotation ? (
        <Typography variant="caption" color={TEXT_SECONDARY} sx={{ mt: 1, display: 'block' }}>
          Letzte Rotation: {new Date(encryptionStats.lastKeyRotation).toLocaleTimeString()}
        </Typography>
      ) : null}
    </Box>
  );
};

interface ChatE2EESectionProps {
  chatStatus: E2EEStatus;
  chatStats: {
    messagesEncrypted: number;
    messagesDecrypted: number;
    verificationFailures: number;
  } | null;
}

const ChatE2EESection: React.FC<ChatE2EESectionProps> = ({ chatStatus, chatStats }) => (
  <Box>
    <Typography
      variant="caption"
      color={TEXT_SECONDARY}
      gutterBottom
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
    >
      <SecurityIcon fontSize="inherit" />
      Chat-Verschlüsselung
    </Typography>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      <Chip
        size="small"
        icon={getStatusIcon(chatStatus)}
        label={getStatusLabel(chatStatus)}
        color={getStatusColor(chatStatus)}
        sx={{ height: 22 }}
      />
    </Box>

    {chatStats ? (
      <Box
        sx={{
          mt: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1,
          fontSize: '0.75rem',
        }}
      >
        <StatItem label="Gesendet" value={chatStats.messagesEncrypted} color="success" />
        <StatItem label="Empfangen" value={chatStats.messagesDecrypted} color="info" />
        <StatItem
          label="Fehler"
          value={chatStats.verificationFailures}
          color={chatStats.verificationFailures > 0 ? 'error' : undefined}
        />
      </Box>
    ) : null}
  </Box>
);

const E2EEDebugPanel: React.FC<E2EEDebugPanelProps> = ({
  status,
  localFingerprint,
  remoteFingerprint,
  keyGeneration,
  encryptionStats,
  errorMessage,
  onRotateKeys,
  chatStatus,
  chatLocalFingerprint: _chatLocalFingerprint, // Reserved for future use
  chatStats,
  compact = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(!compact);
  const [copied, setCopied] = useState<string | null>(null);
  // browserCaps is read-only after initialization, setter not needed
  const browserCaps = useMemo<BrowserCapabilities>(() => getBrowserCapabilities(), []);
  const browserInfo = useMemo(() => getBrowserInfo(), []);

  // Calculate encryption health percentage
  const encryptionHealth = useMemo(() => {
    if (!encryptionStats || encryptionStats.totalFrames === 0) return null;

    const encryptedRatio = encryptionStats.encryptedFrames / encryptionStats.totalFrames;
    const errorRatio =
      (encryptionStats.encryptionErrors + encryptionStats.decryptionErrors) /
      Math.max(encryptionStats.totalFrames, 1);

    return Math.max(0, Math.min(100, encryptedRatio * 100 - errorRatio * 100));
  }, [encryptionStats]);

  const handleCopy = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => {
        setCopied(null);
      }, 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const isActive = status === 'active';
  const hasError = status === 'error' || status === 'unsupported';
  const borderColor = getBorderColor(isActive, hasError, theme);
  const securityIconColor = getSecurityIconColor(isActive, hasError);

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: compact ? 280 : 340,
        maxHeight: expanded ? '80vh' : 'auto',
        overflow: 'hidden',
        zIndex: 10,
        backgroundColor:
          theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: JUSTIFY_SPACE_BETWEEN,
          p: 1.5,
          cursor: 'pointer',
          '&:hover': { backgroundColor: theme.palette.action.hover },
        }}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color={securityIconColor} fontSize="small" />
          <Typography variant="subtitle2" fontWeight="bold">
            E2EE Status
          </Typography>
          <Chip
            size="small"
            icon={getStatusIcon(status)}
            label={getStatusLabel(status)}
            color={getStatusColor(status)}
            sx={{ height: 22 }}
          />
        </Box>
        <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
      </Box>

      {/* Progress indicator for transitional states */}
      {TRANSITIONAL_STATES.has(status) && <LinearProgress color="info" sx={{ height: 2 }} />}

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Error Message */}
          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
              <Typography variant="caption">{errorMessage}</Typography>
            </Alert>
          ) : null}

          {/* Browser Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color={TEXT_SECONDARY} gutterBottom>
              Browser &amp; E2EE-Methode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Chip
                size="small"
                label={`${browserInfo.name} ${browserInfo.majorVersion}`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={browserCaps.e2eeMethod === 'none' ? 'Kein E2EE' : browserCaps.e2eeMethod}
                color={browserCaps.e2eeMethod === 'none' ? 'error' : 'success'}
                variant="outlined"
              />
              {browserInfo.isMobile ? (
                <Chip size="small" label="Mobile" variant="outlined" />
              ) : null}
            </Box>
          </Box>

          {/* Video E2EE Section */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color={TEXT_SECONDARY}
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <FingerprintIcon fontSize="inherit" />
              Video-Verschlüsselung
            </Typography>

            <FingerprintDisplay
              label="Dein Fingerprint:"
              fingerprint={localFingerprint}
              copyLabel="local"
              copied={copied}
              onCopy={handleCopy}
              activeColor="success.main"
            />

            <FingerprintDisplay
              label="Partner Fingerprint:"
              fingerprint={remoteFingerprint}
              copyLabel="remote"
              copied={copied}
              onCopy={handleCopy}
              activeColor="info.main"
            />

            {/* Key Generation */}
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon fontSize="small" color="action" />
              <Typography variant="caption">
                Schlüssel-Generation: <strong>{keyGeneration}</strong>
              </Typography>
              {onRotateKeys && isActive ? (
                <Tooltip title="Schlüssel rotieren">
                  <IconButton size="small" onClick={onRotateKeys}>
                    <RefreshIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
          </Box>

          {/* Encryption Stats */}
          {encryptionStats ? (
            <EncryptionStatsSection
              encryptionStats={encryptionStats}
              encryptionHealth={encryptionHealth}
            />
          ) : null}

          <Divider sx={{ my: 1.5 }} />

          {/* Chat E2EE Section */}
          <ChatE2EESection chatStatus={chatStatus} chatStats={chatStats} />

          {/* Verification Hint */}
          {isActive && localFingerprint && remoteFingerprint ? (
            <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
              <Typography variant="caption">
                <strong>Verifikation:</strong> Vergleiche die Fingerprints mit deinem Partner über
                einen separaten Kanal (z.B. Telefon).
              </Typography>
            </Alert>
          ) : null}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default E2EEDebugPanel;
