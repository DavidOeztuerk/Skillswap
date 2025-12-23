import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { withDefault } from '../../../shared/utils/safeAccess';
import useAuth from '../hooks/useAuth';

// ============================================================================
// INTERFACES
// ============================================================================

interface TwoFactorSetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasExistingSecret?: boolean;
}

// Debug flag - nur in Development loggen
const DEBUG = import.meta.env.DEV;

// Helper function to extract error message from response
function extractErrorMessage(response: unknown): string {
  if (
    response !== null &&
    typeof response === 'object' &&
    'message' in response &&
    typeof (response as { message: unknown }).message === 'string'
  ) {
    return (response as { message: string }).message;
  }
  return 'Failed to generate secret. Please try again.';
}

// ============================================================================
// COMPONENT
// ============================================================================

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ open, onClose, onSuccess }) => {
  // ─────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ─────────────────────────────────────────────────────────────────────────

  const { isLoading, errorMessage, user, generateTwoFactorSecret, verifyTwoFactorCode } = useAuth();

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL STATE
  // ─────────────────────────────────────────────────────────────────────────

  const [activeStep, setActiveStep] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────────────────

  const wasOpenRef = useRef(false);
  const isGeneratingRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────────────────

  const steps = ['Generate Secret', 'Scan QR Code', 'Verify Code'];

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Handle dialog close
   */
  const handleClose = (): void => {
    if (DEBUG) console.debug('🚪 TwoFactorSetup handleClose called');
    onClose();
  };

  /**
   * Generate 2FA secret and create QR code
   */
  const runGenerateSecret = useCallback(async (): Promise<void> => {
    if (isGeneratingRef.current) {
      if (DEBUG) console.debug('⚠️ Already generating secret, skipping...');
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setVerificationError('');

    try {
      if (DEBUG) console.debug('🔑 Generating/fetching 2FA secret...');

      const response = await generateTwoFactorSecret();

      if (DEBUG) console.debug('🔑 2FA secret response:', response);

      if (isSuccessResponse(response)) {
        const secretData = response.data;

        // manualEntryKey falls vorhanden, sonst secret
        const manualKey =
          secretData.manualEntryKey === '' ? secretData.secret : secretData.manualEntryKey;
        setManualEntryKey(manualKey);

        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(secretData.qrCodeUri);
        if (DEBUG) console.debug('📱 QR code generated successfully');

        setQrCodeUrl(qrDataUrl);
        setActiveStep(1);

        if (DEBUG) console.debug('✅ Moving to step 1 - QR code display');
      } else {
        // Error response
        setVerificationError(extractErrorMessage(response));
      }
    } catch (err) {
      console.error('❌ Failed to generate 2FA secret:', err);
      setVerificationError('Failed to generate 2FA secret. Please try again.');
    } finally {
      setIsGenerating(false);
      // Update ref after state to avoid race condition
      setTimeout(() => {
        isGeneratingRef.current = false;
      }, 0);
    }
  }, [generateTwoFactorSecret]);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // Reset state when dialog closes
  useEffect(() => {
    if (!open && wasOpenRef.current) {
      if (DEBUG) console.debug('🔄 Dialog closed, resetting state');
      setActiveStep(0);
      setQrCodeUrl('');
      setVerificationCode('');
      setManualEntryKey('');
      setVerificationError('');
      setIsGenerating(false);
      wasOpenRef.current = false;
    }
  }, [open]);

  // Generate secret when dialog opens
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;

      // Only generate if we haven't already - use ref to avoid race conditions
      if (!isGeneratingRef.current) {
        if (DEBUG) console.debug('🚀 Dialog opened, generating 2FA secret...');
        void runGenerateSecret();
      }
    }
  }, [open, runGenerateSecret]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS (continued)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verify 2FA code
   */
  const handleVerifyCode = async (): Promise<void> => {
    if (verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    if (user?.id === undefined) {
      setVerificationError('User not authenticated. Please log in again.');
      return;
    }

    setVerificationError('');

    try {
      const response = await verifyTwoFactorCode({
        userId: user.id,
        code: verificationCode,
      });

      if (DEBUG) console.debug('🔐 Verify 2FA response:', response);

      if (isSuccessResponse(response)) {
        const verifyData = response.data;

        if (verifyData.success) {
          setActiveStep(3);
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1500);
        } else {
          setVerificationError('Verification failed. Please check your code and try again.');
        }
      } else {
        // Error response
        const errorMsg = response.message ?? 'Verification failed. Please try again.';
        setVerificationError(errorMsg);
      }
    } catch (err: unknown) {
      console.error('❌ 2FA verification error:', err);
      const errMessage =
        err instanceof Error ? err.message : 'Invalid verification code. Please try again.';
      setVerificationError(errMessage);
    }
  };

  /**
   * Handle verification code input change
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replaceAll(/\D/g, '');
    if (value.length <= 6) {
      setVerificationCode(value);
      setVerificationError('');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // Don't render dialog if not open
  if (!open) return null;

  return (
    <Dialog
      open
      onClose={(_, reason) => {
        if (DEBUG) console.debug('🚪 Dialog onClose triggered, reason:', reason);
        // Prevent closing on backdrop click when loading (escapeKeyDown is handled by disableEscapeKeyDown)
        if ((isLoading || isGenerating) && reason === 'backdropClick') {
          if (DEBUG) console.debug('⚠️ Preventing close while loading');
          return;
        }
        handleClose();
      }}
      slotProps={{
        backdrop: {
          onClick:
            isLoading || isGenerating
              ? (e) => {
                  e.stopPropagation();
                }
              : undefined,
        },
      }}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading || isGenerating}
    >
      <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Generating */}
          {activeStep === 0 && (
            <Box textAlign="center">
              <Typography variant="body1" gutterBottom>
                Two-factor authentication adds an extra layer of security to your account.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You&apos;ll need an authenticator app like Google Authenticator or Authy.
              </Typography>
              {isLoading || isGenerating ? (
                <Box sx={{ mt: 3 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Generating your secret key...
                  </Typography>
                </Box>
              ) : null}
            </Box>
          )}

          {/* Step 1: QR Code */}
          {activeStep === 1 && qrCodeUrl !== '' && (
            <Box>
              <Typography variant="body1" gutterBottom align="center">
                Scan this QR code with your authenticator app:
              </Typography>
              <Box display="flex" justifyContent="center" my={2}>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
                </Paper>
              </Box>
              <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
                Can&apos;t scan? Enter this code manually:
              </Typography>
              <TextField
                fullWidth
                value={manualEntryKey}
                variant="outlined"
                size="small"
                slotProps={{ input: { readOnly: true } }}
                sx={{ mb: 2 }}
                onClick={(e) => {
                  (e.target as HTMLInputElement).select();
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setActiveStep(2);
                }}
                sx={{ mt: 2 }}
              >
                Next: Verify Code
              </Button>
            </Box>
          )}

          {/* Step 2: Verify Code */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Enter the 6-digit code from your authenticator app:
              </Typography>
              <TextField
                fullWidth
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="000000"
                variant="outlined"
                slotProps={{
                  input: {
                    inputProps: {
                      maxLength: 6,
                      style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' },
                    },
                  },
                }}
                sx={{ my: 2 }}
              />
              {verificationError !== '' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {verificationError}
                </Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  void handleVerifyCode();
                }}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Verify and Enable 2FA'}
              </Button>
            </Box>
          )}

          {/* Step 3: Success */}
          {activeStep === 3 && (
            <Box textAlign="center">
              <Alert severity="success" sx={{ mb: 2 }}>
                Two-factor authentication has been successfully enabled!
              </Alert>
              <Typography variant="body2" color="textSecondary">
                You&apos;ll now need to enter a code from your authenticator app when logging in.
              </Typography>
            </Box>
          )}

          {/* Global Error */}
          {errorMessage !== undefined && errorMessage !== '' && activeStep !== 3 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {withDefault(errorMessage, 'An error occurred')}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={activeStep === 3}>
          {activeStep === 3 ? 'Closing...' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorSetup;
