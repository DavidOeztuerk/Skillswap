/**
 * E2EE Status Indicator Component
 *
 * Visual indicator for End-to-End Encryption status.
 * Shows encryption state, key fingerprints, and verification status.
 */

import { useState } from 'react';
import {
  Error as ErrorIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Refresh as RefreshIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import type { E2EEState } from '../hooks/types';

// ============================================================================
// Types
// ============================================================================

export interface E2EEStatusIndicatorProps {
  status: E2EEState['status'];
  formattedLocalFingerprint?: string | null;
  formattedRemoteFingerprint?: string | null;
  keyGeneration?: number;
  errorMessage?: string | null;
  onRotateKeys?: () => Promise<void>;
  compact?: boolean;
}

// ============================================================================
// Status Configuration
// ============================================================================

interface StatusConfig {
  icon: React.ReactNode;
  color: 'default' | 'success' | 'warning' | 'error' | 'info';
  label: string;
  tooltip: string;
}

const statusConfigs: Record<E2EEState['status'], StatusConfig> = {
  inactive: {
    icon: <LockOpenIcon fontSize="small" />,
    color: 'default',
    label: 'Unverschlüsselt',
    tooltip: 'Ende-zu-Ende-Verschlüsselung ist nicht aktiv',
  },
  initializing: {
    icon: <CircularProgress size={16} />,
    color: 'info',
    label: 'Initialisiere...',
    tooltip: 'Ende-zu-Ende-Verschlüsselung wird initialisiert',
  },
  'key-exchange': {
    icon: <CircularProgress size={16} />,
    color: 'info',
    label: 'Schlüsselaustausch...',
    tooltip: 'Schlüssel werden ausgetauscht',
  },
  'key-rotation': {
    icon: <RefreshIcon fontSize="small" />,
    color: 'info',
    label: 'Schlüsselrotation...',
    tooltip: 'Neue Schlüssel werden generiert',
  },
  active: {
    icon: <LockIcon fontSize="small" />,
    color: 'success',
    label: 'Verschlüsselt',
    tooltip: 'Ende-zu-Ende-Verschlüsselung aktiv',
  },
  verified: {
    icon: <VerifiedIcon fontSize="small" />,
    color: 'success',
    label: 'Verifiziert',
    tooltip: 'Ende-zu-Ende-Verschlüsselung aktiv und verifiziert',
  },
  error: {
    icon: <ErrorIcon fontSize="small" />,
    color: 'error',
    label: 'Fehler',
    tooltip: 'Verschlüsselungsfehler',
  },
  unsupported: {
    icon: <WarningIcon fontSize="small" />,
    color: 'warning',
    label: 'Nicht unterstützt',
    tooltip: 'Dein Browser unterstützt keine Ende-zu-Ende-Verschlüsselung',
  },
};

// ============================================================================
// Component
// ============================================================================

export const E2EEStatusIndicator = ({
  status,
  formattedLocalFingerprint,
  formattedRemoteFingerprint,
  keyGeneration,
  errorMessage,
  onRotateKeys,
  compact = false,
}: E2EEStatusIndicatorProps): JSX.Element => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const config = statusConfigs[status];

  const handleRotateKeys = async (): Promise<void> => {
    if (!onRotateKeys) return;

    setIsRotating(true);
    try {
      await onRotateKeys();
    } finally {
      setIsRotating(false);
    }
  };

  // Compact mode - just the chip
  if (compact) {
    return (
      <Tooltip title={config.tooltip}>
        <Chip
          icon={config.icon as React.ReactElement}
          label={config.label}
          color={config.color}
          size="small"
          onClick={() => setDialogOpen(true)}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title={config.tooltip}>
        <Chip
          icon={config.icon as React.ReactElement}
          label={config.label}
          color={config.color}
          size="small"
          onClick={() => setDialogOpen(true)}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {config.icon}
          Ende-zu-Ende-Verschlüsselung
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            {/* Status */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                icon={config.icon as React.ReactElement}
                label={config.label}
                color={config.color}
                size="small"
              />
            </Box>

            {/* Error Message */}
            {status === 'error' && errorMessage != null && (
              <Alert severity="error">{errorMessage}</Alert>
            )}

            {status === 'unsupported' && (
              <Alert severity="warning">
                Dein Browser unterstützt keine Ende-zu-Ende-Verschlüsselung für Video-Calls. Der
                Call ist weiterhin über HTTPS gesichert.
              </Alert>
            )}

            {/* Key Information */}
            {(status === 'active' || status === 'verified') && (
              <>
                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Schlüsselgeneration
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {keyGeneration ?? 1}
                  </Typography>
                </Box>

                {/* Local Fingerprint */}
                {formattedLocalFingerprint != null && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Dein Schlüssel-Fingerprint
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{
                        backgroundColor: 'action.hover',
                        padding: 1,
                        borderRadius: 1,
                        wordBreak: 'break-all',
                      }}
                    >
                      {formattedLocalFingerprint}
                    </Typography>
                  </Box>
                )}

                {/* Remote Fingerprint */}
                {formattedRemoteFingerprint != null && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Partner Schlüssel-Fingerprint
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{
                        backgroundColor: 'action.hover',
                        padding: 1,
                        borderRadius: 1,
                        wordBreak: 'break-all',
                      }}
                    >
                      {formattedRemoteFingerprint}
                    </Typography>
                  </Box>
                )}

                {/* Verification Hint */}
                <Alert severity="info" icon={<VerifiedIcon />}>
                  <Typography variant="body2">
                    Um die Verschlüsselung zu verifizieren, vergleiche die Fingerprints über einen
                    separaten Kanal (z.B. Telefon).
                  </Typography>
                </Alert>
              </>
            )}

            {/* Key Rotation */}
            {onRotateKeys != null && (status === 'active' || status === 'verified') && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Schlüsselrotation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="p" sx={{ mb: 1 }}>
                    Generiere neue Verschlüsselungsschlüssel für zusätzliche Sicherheit.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={isRotating ? <CircularProgress size={16} /> : <RefreshIcon />}
                    onClick={handleRotateKeys}
                    disabled={isRotating}
                  >
                    {isRotating ? 'Rotiere...' : 'Schlüssel rotieren'}
                  </Button>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ============================================================================
// Compact Status Badge
// ============================================================================

export const E2EEStatusBadge = ({
  status,
}: Pick<E2EEStatusIndicatorProps, 'status'>): JSX.Element => {
  const config = statusConfigs[status];

  return (
    <Tooltip title={config.tooltip}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor:
            config.color === 'success'
              ? 'success.main'
              : config.color === 'error'
                ? 'error.main'
                : config.color === 'warning'
                  ? 'warning.main'
                  : config.color === 'info'
                    ? 'info.main'
                    : 'action.disabled',
          color: 'white',
        }}
      >
        {config.icon}
      </Box>
    </Tooltip>
  );
};

export default E2EEStatusIndicator;
