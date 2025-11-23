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

interface TwoFactorSetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasExistingSecret?: boolean;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ open, onClose, onSuccess }) => {
  const { 
    isLoading, 
    errorMessage, 
    user, 
    generateTwoFactorSecret, 
    verifyTwoFactorCode 
  } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [, setSecretKey] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Track if dialog was previously open
  const wasOpenRef = useRef(false);
  
  const steps = ['Generate Secret', 'Scan QR Code', 'Verify Code'];

  // Initialize and generate secret when dialog opens
  useEffect(() => {
    if (!open) {
      // Only reset if dialog was previously open (actually closing)
      if (wasOpenRef.current) {
        console.log('🔄 Dialog closed, resetting state');
        setActiveStep(0);
        setQrCodeUrl('');
        setVerificationCode('');
        setManualEntryKey('');
        setVerificationError('');
        setIsGenerating(false);
        wasOpenRef.current = false;
      }
      return;
    }
    
    // Dialog is opening
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      // Only generate if we haven't already
      if (!qrCodeUrl && !isGenerating && activeStep === 0) {
        console.log('🚀 Dialog opened, generating 2FA secret...');
        void generateSecret();
      }
    }
  }, [open]); // Only depend on open prop

  const generateSecret = async () => {
    if (isGenerating) {
      console.log('⚠️ Already generating secret, skipping...');
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log('🔑 Generating/fetching 2FA secret...');
      const result = await generateTwoFactorSecret();
      console.log('🔑 2FA secret result:', result);
      
      if (result.meta.requestStatus === 'fulfilled') {
        const payload = result.payload;
        
        // Type-safe response handling
        if (payload && 
            typeof payload === 'object' && 
            'qrCodeUri' in payload && 
            'secret' in payload &&
            typeof payload.qrCodeUri === 'string' &&
            typeof payload.secret === 'string') {
          
          setSecretKey(payload.secret);
          const manualKey = 'manualEntryKey' in payload && typeof payload.manualEntryKey === 'string' 
            ? payload.manualEntryKey 
            : payload.secret;
          setManualEntryKey(manualKey);
          
          // Generate QR code
          const qrDataUrl = await QRCode.toDataURL(payload.qrCodeUri);
          console.log('📱 QR code generated successfully');
          setQrCodeUrl(qrDataUrl);
          setActiveStep(1);
          console.log('✅ Moving to step 1 - QR code display');
        } else {
          console.warn('⚠️ Invalid secret response format:', payload);
          setVerificationError('Invalid response from server. Please try again.');
        }
      } else {
        console.warn('⚠️ Request failed:', result);
        setVerificationError('Failed to generate secret. Please try again.');
      }
    } catch (err) {
      console.error('❌ Failed to generate 2FA secret:', err);
      setVerificationError('Failed to generate 2FA secret. Please try again.');
      // Don't close the dialog on error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    try {
      if (!user?.id) {
        setVerificationError('User not authenticated. Please log in again.');
        return;
      }
      
      const result = await verifyTwoFactorCode({ 
        userId: user.id,
        code: verificationCode
      });
      
      if (result?.meta?.requestStatus === 'fulfilled') {
        const payload = result.payload;
        
        // Check if verification was successful
        if (payload && 
            typeof payload === 'object' && 
            ('success' in payload ? payload.success : true)) {
          setActiveStep(3);
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1500);
        } else {
          setVerificationError('Verification failed. Please check your code and try again.');
        }
      } else {
        // Handle error case - result.meta.requestStatus is 'rejected'
        const errorMsg = result?.meta?.requestStatus === 'rejected' && 'payload' in result 
          ? (typeof result.payload === 'object' && result.payload && 'message' in result.payload 
            ? String(result.payload.message) 
            : 'Verification failed')
          : 'Verification failed';
        setVerificationError(errorMsg);
      }
    } catch (err: unknown) {
      console.error('❌ 2FA verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code. Please try again.';
      setVerificationError(errorMessage);
    }
  };

  const handleClose = () => {
    console.log('🚪 TwoFactorSetup handleClose called');
    // The cleanup will be handled by the useEffect when open becomes false
    onClose();
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setVerificationCode(value);
      setVerificationError('');
    }
  };

  // Don't render dialog if not open
  if (!open) return null;
  
  return (
    <Dialog 
      open={true} 
      onClose={(_, reason) => {
        console.log('🚪 Dialog onClose triggered, reason:', reason);
        // Prevent closing on backdrop click or escape when loading or generating
        if ((isLoading || isGenerating) && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
          console.log('⚠️ Preventing close while loading');
          return;
        }
        handleClose();
      }} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={isLoading || isGenerating}>
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