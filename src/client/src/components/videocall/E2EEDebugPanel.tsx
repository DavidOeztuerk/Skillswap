import React, { useState, useMemo, type JSX } from 'react';
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
} from '@mui/material';
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
import type { EncryptionStats } from '../../store/adapters/videoCallAdapter+State';
import {
  getBrowserInfo,
  getBrowserCapabilities,
  type BrowserCapabilities,
} from '../../utils/browserDetection';

// ============================================================================
// Types
// ============================================================================

type E2EEStatus =
  | 'disabled'
  | 'initializing'
  | 'key-exchange'
  | 'active'
  | 'key-rotation'
  | 'error'
  | 'unsupported';

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
  const clean = fp.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
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
    default:
      return 'default';
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
    default:
      return <SecurityIcon fontSize="small" />;
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
    default:
      return status;
  }
}

// ============================================================================
// Component
// ============================================================================

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
        color="text.secondary"
        sx={{ display: 'block', fontSize: '0.65rem' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight="bold"
        color={color !== undefined ? `${color}.main` : 'text.primary'}
        sx={{ fontSize: '0.8rem' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Box>
  );
};

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
  const [browserCaps] = useState<BrowserCapabilities>(() => getBrowserCapabilities());

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
        border: `1px solid ${
          isActive
            ? theme.palette.success.main
            : hasError
              ? theme.palette.error.main
              : theme.palette.divider
        }`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          cursor: 'pointer',
          '&:hover': { backgroundColor: theme.palette.action.hover },
        }}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon
            color={isActive ? 'success' : hasError ? 'error' : 'action'}
            fontSize="small"
          />
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
      {['initializing', 'key-exchange', 'key-rotation'].includes(status) && (
        <LinearProgress color="info" sx={{ height: 2 }} />
      )}

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Error Message */}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
              <Typography variant="caption">{errorMessage}</Typography>
            </Alert>
          )}

          {/* Browser Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Browser &amp; E2EE-Methode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Chip
                size="small"
                label={`${browserInfo.name} ${String(browserInfo.majorVersion)}`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={browserCaps.e2eeMethod === 'none' ? 'Kein E2EE' : browserCaps.e2eeMethod}
                color={browserCaps.e2eeMethod !== 'none' ? 'success' : 'error'}
                variant="outlined"
              />
              {browserInfo.isMobile && <Chip size="small" label="Mobile" variant="outlined" />}
            </Box>
          </Box>

          {/* Video E2EE Section */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <FingerprintIcon fontSize="inherit" />
              Video-Verschlüsselung
            </Typography>

            {/* Local Fingerprint */}
            <Box sx={{ mt: 1, p: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Dein Fingerprint:
                </Typography>
                {localFingerprint && (
                  <Tooltip title={copied === 'local' ? 'Kopiert!' : 'Kopieren'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleCopy(localFingerprint, 'local');
                      }}
                    >
                      <CopyIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography
                variant="body2"
                fontFamily="monospace"
                fontWeight="bold"
                color={localFingerprint ? 'success.main' : 'text.disabled'}
              >
                {formatFingerprint(localFingerprint)}
              </Typography>
            </Box>

            {/* Remote Fingerprint */}
            <Box sx={{ mt: 1, p: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Partner Fingerprint:
                </Typography>
                {remoteFingerprint && (
                  <Tooltip title={copied === 'remote' ? 'Kopiert!' : 'Kopieren'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleCopy(remoteFingerprint, 'remote');
                      }}
                    >
                      <CopyIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography
                variant="body2"
                fontFamily="monospace"
                fontWeight="bold"
                color={remoteFingerprint ? 'info.main' : 'text.disabled'}
              >
                {formatFingerprint(remoteFingerprint)}
              </Typography>
            </Box>

            {/* Key Generation */}
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon fontSize="small" color="action" />
              <Typography variant="caption">
                Schlüssel-Generation: <strong>{keyGeneration}</strong>
              </Typography>
              {onRotateKeys && isActive && (
                <Tooltip title="Schlüssel rotieren">
                  <IconButton size="small" onClick={onRotateKeys}>
                    <RefreshIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Encryption Stats */}
          {encryptionStats && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <TimelineIcon fontSize="inherit" />
                Verschlüsselungs-Statistik
              </Typography>

              {/* Health Bar */}
              {encryptionHealth !== null && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Encryption Health</Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {encryptionHealth.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={encryptionHealth}
                    color={
                      encryptionHealth > 95
                        ? 'success'
                        : encryptionHealth > 80
                          ? 'warning'
                          : 'error'
                    }
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>
              )}

              {/* Stats Grid */}
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
                <StatItem
                  label="Verschlüsselt"
                  value={encryptionStats.encryptedFrames}
                  color="success"
                />
                <StatItem
                  label="Entschlüsselt"
                  value={encryptionStats.decryptedFrames}
                  color="info"
                />
                <StatItem
                  label="Fehler"
                  value={encryptionStats.encryptionErrors + encryptionStats.decryptionErrors}
                  color={
                    encryptionStats.encryptionErrors + encryptionStats.decryptionErrors > 0
                      ? 'error'
                      : undefined
                  }
                />
                <StatItem
                  label="Ø Encrypt"
                  value={`${encryptionStats.averageEncryptionTime.toFixed(2)}ms`}
                />
                <StatItem
                  label="Ø Decrypt"
                  value={`${encryptionStats.averageDecryptionTime.toFixed(2)}ms`}
                />
              </Box>

              {encryptionStats.lastKeyRotation && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Letzte Rotation: {new Date(encryptionStats.lastKeyRotation).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Chat E2EE Section */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
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

            {chatStats && (
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
            )}
          </Box>

          {/* Verification Hint */}
          {isActive && localFingerprint && remoteFingerprint && (
            <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
              <Typography variant="caption">
                <strong>Verifikation:</strong> Vergleiche die Fingerprints mit deinem Partner über
                einen separaten Kanal (z.B. Telefon).
              </Typography>
            </Alert>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default E2EEDebugPanel;
