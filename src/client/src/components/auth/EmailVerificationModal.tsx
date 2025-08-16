import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  Stack,
  TextField,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import { verifyEmail, clearError } from '../../features/auth/authSlice';
import { useLoading, LoadingKeys } from '../../contexts/LoadingContext';
import LoadingButton from '../ui/LoadingButton';
import authService from '../../api/services/authService';

// Validation schema
const emailVerificationSchema = z.object({
  code: z
    .string()
    .min(6, 'Der Verifizierungscode muss 6 Zeichen lang sein')
    .max(6, 'Der Verifizierungscode muss 6 Zeichen lang sein')
    .regex(/^\d{6}$/, 'Der Code muss aus 6 Ziffern bestehen'),
});

type EmailVerificationFormValues = z.infer<typeof emailVerificationSchema>;

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
  email?: string;
  onVerificationSuccess?: () => void;
  autoVerifyToken?: string; // For URL-based verification
}

/**
 * Email Verification Modal Component
 * Provides a modal dialog for email verification with 6-digit code input
 */
const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  open,
  onClose,
  email,
  onVerificationSuccess,
  autoVerifyToken,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, withLoading } = useLoading();
  const { user, error } = useAppSelector((state) => state.auth);
  
  const [isVerified, setIsVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Input refs for auto-focus
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Use provided email or get from user state
  const userEmail = email || user?.email || '';
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EmailVerificationFormValues>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      code: '',
    },
  });
  
  const codeValue = watch('code');
  
  // Auto-verify if token is provided
  useEffect(() => {
    if (open && autoVerifyToken && userEmail) {
      setValue('code', autoVerifyToken);
      handleVerification(autoVerifyToken);
    }
  }, [open, autoVerifyToken, userEmail]);
  
  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  // Clear errors when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setLocalError(null);
      setResendMessage(null);
      setIsVerified(false);
      dispatch(clearError());
    }
  }, [open, reset, dispatch]);
  
  // Handle verification
  const handleVerification = async (code: string) => {
    await withLoading(LoadingKeys.VERIFY_EMAIL, async () => {
      try {
        setLocalError(null);
        
        await dispatch(
          verifyEmail({ 
            email: userEmail, 
            verificationToken: code 
          })
        ).unwrap();
        
        setIsVerified(true);
        
        // Call success callback after a short delay
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess();
          }
          onClose();
        }, 2000);
      } catch (err: any) {
        console.error('Email verification failed:', err);
        setLocalError(
          err?.message || 
          'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code.'
        );
      }
    });
  };
  
  // Handle form submission
  const onSubmit: SubmitHandler<EmailVerificationFormValues> = async (data) => {
    await handleVerification(data.code);
  };
  
  // Handle resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !userEmail) return;
    
    await withLoading('resendVerification', async () => {
      try {
        setLocalError(null);
        setResendMessage(null);
        
        // Call resend API
        await authService.resendEmailVerification(userEmail);
        
        setResendMessage('Eine neue Verifizierungs-E-Mail wurde gesendet.');
        setResendCooldown(60); // 60 second cooldown
        reset(); // Clear the code input
      } catch (err: any) {
        console.error('Resend verification failed:', err);
        setLocalError(
          err?.message || 
          'Fehler beim Senden der Verifizierungs-E-Mail.'
        );
      }
    });
  };
  
  // Handle single digit input
  const handleDigitInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = codeValue.split('');
    newCode[index] = value.slice(-1); // Take only last character
    const updatedCode = newCode.join('').slice(0, 6);
    setValue('code', updatedCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits are entered
    if (updatedCode.length === 6) {
      handleSubmit(onSubmit)();
    }
  };
  
  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setValue('code', pastedData);
    
    // Auto-submit if 6 digits were pasted
    if (pastedData.length === 6) {
      handleSubmit(onSubmit)();
    }
  };
  
  // Success state content
  if (isVerified) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon 
              color="success" 
              sx={{ fontSize: 64, mb: 2 }} 
            />
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
              Erfolgreich verifiziert!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ihre E-Mail-Adresse wurde erfolgreich verifiziert.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          <Typography variant="h6">E-Mail verifizieren</Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            {/* Instructions */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Wir haben einen Verifizierungscode an
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {userEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                gesendet. Bitte geben Sie den 6-stelligen Code ein.
              </Typography>
            </Box>
            
            {/* Error Display */}
            {(localError || error) && (
              <Alert 
                severity="error" 
                icon={<ErrorIcon />}
                onClose={() => {
                  setLocalError(null);
                  dispatch(clearError());
                }}
              >
                {localError || error?.message}
              </Alert>
            )}
            
            {/* Success Message */}
            {resendMessage && (
              <Alert 
                severity="success"
                onClose={() => setResendMessage(null)}
              >
                {resendMessage}
              </Alert>
            )}
            
            {/* Code Input Fields */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextField
                  key={index}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  value={codeValue[index] || ''}
                  onChange={(e) => handleDigitInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading(LoadingKeys.VERIFY_EMAIL)}
                  variant="outlined"
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      width: '50px',
                      height: '50px',
                      padding: 0,
                    },
                    'aria-label': `Ziffer ${index + 1}`,
                    autoComplete: 'off',
                  }}
                  error={!!errors.code && codeValue.length === 6}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: errors.code ? 'error.main' : 'primary.main',
                        },
                      },
                    },
                  }}
                />
              ))}
            </Box>
            
            {/* Error message for code */}
            {errors.code && (
              <Typography 
                variant="caption" 
                color="error" 
                sx={{ textAlign: 'center' }}
              >
                {errors.code.message}
              </Typography>
            )}
            
            {/* Hidden Controller for form validation */}
            <Controller
              name="code"
              control={control}
              render={() => <></>}
            />
            
            <Divider />
            
            {/* Resend Section */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Keine E-Mail erhalten?
              </Typography>
              <Button
                onClick={handleResendVerification}
                variant="text"
                startIcon={resendCooldown === 0 ? <RefreshIcon /> : null}
                disabled={resendCooldown > 0 || !userEmail || isLoading('resendVerification')}
                sx={{ textTransform: 'none' }}
              >
                {isLoading('resendVerification') ? (
                  <CircularProgress size={20} />
                ) : resendCooldown > 0 ? (
                  `Erneut senden in ${resendCooldown}s`
                ) : (
                  'Code erneut senden'
                )}
              </Button>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={() => {
            // If context provides snooze, use it
            const context = (window as any).emailVerificationContext;
            if (context?.snoozeVerification) {
              context.snoozeVerification(24);
            }
            onClose();
          }} 
          variant="outlined"
          disabled={isLoading(LoadingKeys.VERIFY_EMAIL)}
        >
          Später verifizieren
        </Button>
        <LoadingButton
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="primary"
          loading={isLoading(LoadingKeys.VERIFY_EMAIL)}
          disabled={codeValue.length !== 6}
        >
          Verifizieren
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default EmailVerificationModal;