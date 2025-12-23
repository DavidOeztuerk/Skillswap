import React, { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useForm, Controller, type SubmitHandler, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
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
import { useLoading } from '../../../core/contexts/loadingContextHooks';
import { LoadingKeys } from '../../../core/contexts/loadingContextValue';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';

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
  autoVerifyToken?: string;
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
  const { isLoading, withLoading } = useLoading();
  const { user, errorMessage, verifyEmail, clearError } = useAuth();

  const [isVerified, setIsVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userEmail = email ?? user?.email ?? '';

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<EmailVerificationFormValues>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      code: '',
    },
  });

  const codeValue = useWatch({ control, name: 'code', defaultValue: '' });

  useEffect(() => {
    if (open && autoVerifyToken && userEmail) {
      setValue('code', autoVerifyToken);
      // handleVerification is intentionally not in deps to avoid re-running on every render
      // This effect should only run when dialog opens with a token
      void withLoading(LoadingKeys.VERIFY_EMAIL, async () => {
        try {
          setLocalError(null);

          verifyEmail({
            email: userEmail,
            verificationToken: autoVerifyToken,
          });

          setIsVerified(true);

          setTimeout(() => {
            if (onVerificationSuccess) {
              onVerificationSuccess();
            }
            onClose();
          }, 2000);
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            const errorData = err.response?.data as { message?: string } | undefined;
            setLocalError(
              errorData?.message ?? 'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code.'
            );
          } else {
            setLocalError(
              'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
            );
          }
        }
        await Promise.resolve();
      });
    }
  }, [
    open,
    autoVerifyToken,
    userEmail,
    setValue,
    withLoading,
    verifyEmail,
    onVerificationSuccess,
    onClose,
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [resendCooldown]);

  // Handle dialog close reset - Use refs to track previous open state
  const prevOpenRef = React.useRef(open);
  useEffect(() => {
    // Only run cleanup when dialog transitions from open to closed
    if (prevOpenRef.current && !open) {
      // Use requestAnimationFrame to defer setState until after React's render cycle
      requestAnimationFrame(() => {
        reset();
        setLocalError(null);
        setResendMessage(null);
        setIsVerified(false);
        clearError();
      });
    }
    prevOpenRef.current = open;
  }, [open, reset, clearError]);

  const handleVerification = async (code: string): Promise<void> => {
    await withLoading(LoadingKeys.VERIFY_EMAIL, async () => {
      try {
        setLocalError(null);

        verifyEmail({
          email: userEmail,
          verificationToken: code,
        });

        setIsVerified(true);

        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess();
          }
          onClose();
        }, 2000);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const errorData = err.response?.data as { message?: string } | undefined;
          setLocalError(
            errorData?.message ?? 'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code.'
          );
        } else {
          setLocalError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
      }
      await Promise.resolve();
    });
  };

  // Handle form submission
  const onSubmit: SubmitHandler<EmailVerificationFormValues> = async (data) => {
    await handleVerification(data.code);
  };

  // Handle resend verification email
  const handleResendVerification = async (): Promise<void> => {
    if (resendCooldown > 0 || !userEmail) return;

    await withLoading('resendVerification', async () => {
      try {
        setLocalError(null);
        setResendMessage(null);

        await authService.resendEmailVerification(userEmail);

        setResendMessage('Eine neue Verifizierungs-E-Mail wurde gesendet.');
        setResendCooldown(60);
        reset();
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const errorData = err.response?.data as { message?: string } | undefined;
          setLocalError(errorData?.message ?? 'Fehler beim Senden der Verifizierungs-E-Mail.');
        } else {
          setLocalError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
      }
    });
  };

  // Handle single digit input
  const handleDigitInput = (index: number, value: string): void => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    // Build new code by replacing character at index (digits only, no Unicode concerns)
    const digit = value.slice(-1);
    const before = codeValue.slice(0, index);
    const after = codeValue.slice(index + 1);
    const updatedCode = (before + digit + after).slice(0, 6);
    setValue('code', updatedCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (updatedCode.length === 6) {
      void handleSubmit(onSubmit)();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent): void => {
    if (e.key === 'Backspace' && !codeValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent): void => {
    e.preventDefault();
    const rawData = e.clipboardData.getData('text');
    const pastedData = rawData.replaceAll(/\D/g, '').slice(0, 6);
    setValue('code', pastedData);

    // Auto-submit if 6 digits were pasted
    if (pastedData.length === 6) {
      void handleSubmit(onSubmit)();
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
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
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
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
          },
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
            {(localError ?? errorMessage) ? (
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                onClose={() => {
                  setLocalError(null);
                  clearError();
                }}
              >
                {localError ?? errorMessage}
              </Alert>
            ) : null}

            {/* Success Message */}
            {resendMessage ? (
              <Alert
                severity="success"
                onClose={() => {
                  setResendMessage(null);
                }}
              >
                {resendMessage}
              </Alert>
            ) : null}

            {/* Code Input Fields */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextField
                  key={index}
                  inputRef={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                  }}
                  value={codeValue[index] || ''}
                  onChange={(e) => {
                    handleDigitInput(index, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    handleKeyDown(index, e);
                  }}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading(LoadingKeys.VERIFY_EMAIL)}
                  variant="outlined"
                  slotProps={{
                    htmlInput: {
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
                    },
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
            {errors.code ? (
              <Typography variant="caption" color="error" sx={{ textAlign: 'center' }}>
                {errors.code.message}
              </Typography>
            ) : null}

            {/* Hidden Controller for form validation */}
            {/* eslint-disable-next-line react/jsx-no-useless-fragment -- Controller requires ReactElement return */}
            <Controller name="code" control={control} render={() => <></>} />

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
                {isLoading('resendVerification') && <CircularProgress size={20} />}
                {!isLoading('resendVerification') &&
                  resendCooldown > 0 &&
                  `Erneut senden in ${resendCooldown}s`}
                {!isLoading('resendVerification') && resendCooldown === 0 && 'Code erneut senden'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => {
            // If context provides snooze, use it
            const context = (
              window as Window & {
                emailVerificationContext?: { snoozeVerification?: (hours: number) => void };
              }
            ).emailVerificationContext;
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
