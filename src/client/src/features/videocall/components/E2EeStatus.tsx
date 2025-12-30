/**
 * E2EE Status Component
 *
 * Displays the End-to-End Encryption status for video calls.
 * Shows:
 * - Encryption status indicator
 * - Key fingerprints (for MITM detection)
 * - Encryption statistics
 * - Key generation number
 */

import React, { type JSX, useState } from 'react';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import type { E2EEStatus } from '../hooks/types';

interface E2EEStatusProps {
  status: E2EEStatus;
  isActive: boolean;
  localFingerprint: string | null;
  remoteFingerprint: string | null;
  keyGeneration: number;
  encryptionStats: {
    totalFrames: number;
    encryptedFrames: number;
    decryptedFrames: number;
    encryptionErrors: number;
    decryptionErrors: number;
    averageEncryptionTime: number;
    averageDecryptionTime: number;
    droppedFrames?: number;
  } | null;
  errorMessage: string | null;
  onRotateKeys?: () => void;
}

export const E2EEStatusComponent: React.FC<E2EEStatusProps> = ({
  status,
  isActive,
  localFingerprint,
  remoteFingerprint,
  keyGeneration,
  encryptionStats,
  errorMessage,
  onRotateKeys,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  /**
   * Get status color
   */
  const getStatusColor = (): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'active':
      case 'verified':
        return 'success';
      case 'initializing':
      case 'key-exchange':
      case 'key-rotation':
        return 'info';
      case 'error':
        return 'error';
      case 'unsupported':
        return 'warning';
      case 'inactive':
        return 'default';
      default: {
        const _exhaustiveCheck: never = status;
        return _exhaustiveCheck;
      }
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (): JSX.Element => {
    switch (status) {
      case 'active':
      case 'verified':
        return <LockIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      case 'unsupported':
        return <WarningIcon fontSize="small" />;
      case 'inactive':
        return <LockOpenIcon fontSize="small" />;
      case 'initializing':
      case 'key-exchange':
      case 'key-rotation':
        return <LockOpenIcon fontSize="small" />;
      default: {
        const _exhaustiveCheck: never = status;
        return _exhaustiveCheck;
      }
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (): string => {
    switch (status) {
      case 'inactive':
        return 'Not Encrypted';
      case 'initializing':
        return 'Initializing E2EE...';
      case 'key-exchange':
        return 'Exchanging Keys...';
      case 'active':
        return `Encrypted (Gen ${keyGeneration})`;
      case 'verified':
        return `Verified (Gen ${keyGeneration})`;
      case 'key-rotation':
        return 'Rotating Keys...';
      case 'error':
        return 'Encryption Error';
      case 'unsupported':
        return 'E2EE Not Supported';
      default:
        return 'Unknown';
    }
  };

  /**
   * Format fingerprint for compact display
   */
  const formatFingerprintShort = (fp: string | null): string => {
    if (!fp) return 'N/A';
    return `${fp.slice(0, 8)}...${fp.slice(Math.max(0, fp.length - 8))}`.toUpperCase();
  };

  /**
   * Get encryption success rate
   */
  const getEncryptionSuccessRate = (): number => {
    if (!encryptionStats || encryptionStats.encryptedFrames === 0) return 100;
    const totalAttempts = encryptionStats.encryptedFrames + encryptionStats.encryptionErrors;
    return (encryptionStats.encryptedFrames / totalAttempts) * 100;
  };

  /**
   * Get decryption success rate
   */
  const getDecryptionSuccessRate = (): number => {
    if (!encryptionStats || encryptionStats.decryptedFrames === 0) return 100;
    const totalAttempts = encryptionStats.decryptedFrames + encryptionStats.decryptionErrors;
    return (encryptionStats.decryptedFrames / totalAttempts) * 100;
  };

  /**
   * Check if dropped frames are significant
   * Warnung ab 10 gedroppten Frames oder >1% Drop-Rate
   */
  const hasSignificantDroppedFrames = (): boolean => {
    if (encryptionStats?.droppedFrames == null) return false;
    const droppedCount = encryptionStats.droppedFrames;
    const dropRate = (droppedCount / Math.max(1, encryptionStats.totalFrames)) * 100;
    return droppedCount > 10 || dropRate > 1;
  };

  return (
    <>
      {/* Status Chip */}
      <Tooltip title="Click for E2EE details" arrow>
        <Chip
          icon={getStatusIcon()}
          label={getStatusLabel()}
          color={getStatusColor()}
          size="small"
          onClick={() => {
            setShowDetails(true);
          }}
          sx={{
            cursor: 'pointer',
            fontWeight: 'medium',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        />
      </Tooltip>

      {/* Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color={isActive ? 'success' : 'disabled'} />
          End-to-End Encryption
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Status Alert */}
            {status === 'error' && (
              <Alert severity="error" icon={<ErrorIcon />}>
                <Typography variant="body2" fontWeight="medium">
                  Encryption Error
                </Typography>
                <Typography variant="caption">{errorMessage}</Typography>
              </Alert>
            )}

            {status === 'unsupported' && (
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="medium">
                  Browser Not Supported
                </Typography>
                <Typography variant="caption">
                  Please use Chrome 86+, Edge 86+, or Firefox 117+ for E2EE support.
                </Typography>
              </Alert>
            )}

            {isActive ? (
              <Alert severity="success" icon={<LockIcon />}>
                <Typography variant="body2" fontWeight="medium">
                  Your call is end-to-end encrypted
                </Typography>
                <Typography variant="caption">
                  Only you and your peer can see and hear this call. Key generation: {keyGeneration}
                </Typography>
              </Alert>
            ) : null}

            {/* Dropped Frames Warning */}
            {isActive && hasSignificantDroppedFrames() ? (
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="medium">
                  Frames werden verworfen
                </Typography>
                <Typography variant="caption">
                  {encryptionStats?.droppedFrames?.toLocaleString()} Frames wurden verworfen. Dies
                  kann zu kurzen Aussetzern im Video führen. Mögliche Ursachen: langsame Verbindung,
                  Key-Exchange in Bearbeitung, oder hohe CPU-Last.
                </Typography>
              </Alert>
            ) : null}

            {/* Key Fingerprints */}
            {(localFingerprint !== null || remoteFingerprint !== null) && (
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  Security Verification
                  <Tooltip title="Compare these fingerprints with your peer to detect man-in-the-middle attacks">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </Typography>

                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Your Fingerprint
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{
                        backgroundColor: 'action.hover',
                        p: 1,
                        borderRadius: 1,
                        wordBreak: 'break-all',
                      }}
                    >
                      {formatFingerprintShort(localFingerprint)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Peer&apos;s Fingerprint
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{
                        backgroundColor: 'action.hover',
                        p: 1,
                        borderRadius: 1,
                        wordBreak: 'break-all',
                      }}
                    >
                      {formatFingerprintShort(remoteFingerprint)}
                    </Typography>
                  </Box>
                </Stack>

                <Alert severity="info" sx={{ mt: 1.5 }} icon={<InfoIcon />}>
                  <Typography variant="caption">
                    For maximum security, verbally confirm these fingerprints match with your peer.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Encryption Statistics */}
            {encryptionStats && isActive ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Encryption Statistics
                </Typography>

                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Encryption Success Rate
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {getEncryptionSuccessRate().toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getEncryptionSuccessRate()}
                      color={getEncryptionSuccessRate() > 95 ? 'success' : 'warning'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Decryption Success Rate
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {getDecryptionSuccessRate().toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getDecryptionSuccessRate()}
                      color={getDecryptionSuccessRate() > 95 ? 'success' : 'warning'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total Frames
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {encryptionStats.totalFrames.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Encrypted
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {encryptionStats.encryptedFrames.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Decrypted
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {encryptionStats.decryptedFrames.toLocaleString()}
                      </Typography>
                    </Box>

                    {(encryptionStats.encryptionErrors > 0 ||
                      encryptionStats.decryptionErrors > 0) && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Errors
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" color="error.main">
                          {(
                            encryptionStats.encryptionErrors + encryptionStats.decryptionErrors
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    {(encryptionStats.droppedFrames ?? 0) > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Dropped
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" color="warning.main">
                          {encryptionStats.droppedFrames?.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider />

                  <Stack direction="row" spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Avg. Encryption Time
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {encryptionStats.averageEncryptionTime.toFixed(2)} ms
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Avg. Decryption Time
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {encryptionStats.averageDecryptionTime.toFixed(2)} ms
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          {isActive && onRotateKeys ? (
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => {
                onRotateKeys();
                setShowDetails(false);
              }}
              color="primary"
            >
              Rotate Keys
            </Button>
          ) : null}

          <Button
            onClick={() => {
              setShowDetails(false);
            }}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default E2EEStatusComponent;
