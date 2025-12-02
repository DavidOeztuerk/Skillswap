import React, { useState, useEffect, useRef } from 'react';
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
  Paper
} from '@mui/material';
import QRCode from 'qrcode';
import { useAuth } from '../../hooks/useAuth';
import { withDefault } from '../../utils/safeAccess';
import { isSuccessResponse } from '../../types/api/UnifiedResponse';
import type { GenerateTwoFactorSecretResponse } from '../../types/contracts/responses/GenerateTwoFactorSecretResponse';
import type { VerifyTwoFactorCodeResponse } from '../../types/contracts/responses/VerifyTwoFactorCodeResponse';

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

// ============================================================================
// COMPONENT
// ============================================================================

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  // ─────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ─────────────────────────────────────────────────────────────────────────
  
  const { 
    isLoading, 
    errorMessage, 
    user, 
    generateTwoFactorSecret, 
    verifyTwoFactorCode 
  } = useAuth();
  
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
  
  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────────────────
  
  const steps = ['Generate Secret', 'Scan QR Code', 'Verify Code'];

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
      
      // Only generate if we haven't already
      if (!qrCodeUrl && !isGenerating && activeStep === 0) {
        if (DEBUG) console.debug('🚀 Dialog opened, generating 2FA secret...');
        void generateSecret();
      }
    }
  }, [open, qrCodeUrl, isGenerating, activeStep]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Generate 2FA secret
   */
  const generateSecret = async (): Promise<void> => {
    if (isGenerating) {
      if (DEBUG) console.debug('⚠️ Already generating secret, skipping...');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      if (DEBUG) console.debug('🔑 Generating/fetching 2FA secret...');
      
      const result = await generateTwoFactorSecret();
      
      if (DEBUG) console.debug('🔑 2FA secret result:', result.meta.requestStatus);
      
      if (result.meta.requestStatus === 'fulfilled') {
        const payload = result.payload;
        
        if (payload && isSuccessResponse(payload)) {
          const secretData = payload.data as GenerateTwoFactorSecretResponse;
          
          if (secretData?.qrCodeUri && secretData?.secret) {
            // manualEntryKey falls vorhanden, sonst secret
            const manualKey = secretData.manualEntryKey ?? secretData.secret;
            setManualEntryKey(manualKey);
            
            // Generate QR code
            const qrDataUrl = await QRCode.toDataURL(secretData.qrCodeUri);
            if (DEBUG) console.debug('📱 QR code generated successfully');
            
            setQrCodeUrl(qrDataUrl);
            setActiveStep(1);
            
            if (DEBUG) console.debug('✅ Moving to step 1 - QR code display');
          } else {
            console.warn('⚠️ Invalid secret response format - missing qrCodeUri or secret');
            setVerificationError('Invalid response from server. Please try again.');
          }
        } else {
          // Payload ist kein SuccessResponse (sollte nicht passieren bei fulfilled)
          console.warn('⚠️ Unexpected payload format');
          setVerificationError('Unexpected response format. Please try again.');
        }
      } else {
        // rejected
        if (DEBUG) console.debug('⚠️ Request failed:', result.meta.requestStatus);
        setVerificationError('Failed to generate secret. Please try again.');
      }
    } catch (err) {
      console.error('❌ Failed to generate 2FA secret:', err);
      setVerificationError('Failed to generate 2FA secret. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Verify 2FA code
   */
  const handleVerifyCode = async (): Promise<void> => {
    if (verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    if (!user?.id) {
      setVerificationError('User not authenticated. Please log in again.');
      return;
    }
    
    try {
      const result = await verifyTwoFactorCode({ 
        userId: user.id,
        code: verificationCode
      });
      
      if (result.meta.requestStatus === 'fulfilled') {
        const payload = result.payload;
        
        if (payload && isSuccessResponse(payload)) {
          const verifyData = payload.data as VerifyTwoFactorCodeResponse;
          
          // Check if verification was successful
          // VerifyTwoFactorCodeResponse hat typischerweise success oder isValid
          const isVerified = verifyData?.success ?? true;
          
          if (isVerified) {
            setActiveStep(3);
            setTimeout(() => {
              onSuccess();
              handleClose();
            }, 1500);
          } else {
            setVerificationError('Verification failed. Please check your code and try again.');
          }
        } else {
          setVerificationError('Unexpected response format. Please try again.');
        }
      } else {
        // rejected - extract error message from payload
        const errorPayload = result.payload;
        let errorMsg = 'Verification failed';
        
        if (errorPayload && typeof errorPayload === 'object') {
          if ('message' in errorPayload && typeof errorPayload.message === 'string') {
            errorMsg = errorPayload.message;
          } else if ('errors' in errorPayload && Array.isArray(errorPayload.errors)) {
            errorMsg = errorPayload.errors[0] ?? errorMsg;
          }
        }
        
        setVerificationError(errorMsg);
      }
    } catch (err: unknown) {
      console.error('❌ 2FA verification error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Invalid verification code. Please try again.';
      setVerificationError(errorMessage);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = (): void => {
    if (DEBUG) console.debug('🚪 TwoFactorSetup handleClose called');
    onClose();
  };

  /**
   * Handle verification code input change
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, '');
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
      open={true} 
      onClose={(_, reason) => {
        if (DEBUG) console.debug('🚪 Dialog onClose triggered, reason:', reason);
        // Prevent closing on backdrop click or escape when loading
        if ((isLoading || isGenerating) && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
          if (DEBUG) console.debug('⚠️ Preventing close while loading');
          return;
        }
        handleClose();
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
                You'll need an authenticator app like Google Authenticator or Authy.
              </Typography>
              {(isLoading || isGenerating) && (
                <Box sx={{ mt: 3 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Generating your secret key...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Step 1: QR Code */}
          {activeStep === 1 && qrCodeUrl && (
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
                Can't scan? Enter this code manually:
              </Typography>
              <TextField
                fullWidth
                value={manualEntryKey}
                variant="outlined"
                size="small"
                slotProps={{ input: { readOnly: true }}}
                sx={{ mb: 2 }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={() => setActiveStep(2)}
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
                      style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }
                    }
                  }
                }}
                sx={{ my: 2 }}
                autoFocus
              />
              {verificationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {verificationError}
                </Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyCode}
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
                You'll now need to enter a code from your authenticator app when logging in.
              </Typography>
            </Box>
          )}

          {/* Global Error */}
          {errorMessage && activeStep !== 3 && (
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
