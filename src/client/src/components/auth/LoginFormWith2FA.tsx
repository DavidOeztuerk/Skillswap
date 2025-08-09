import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
  Fade,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import { login, clearError, clearTwoFactorState } from '../../features/auth/authSlice';
import LoadingButton from '../ui/LoadingButton';
import { isValidEmail } from '../../utils/validators';
import { errorService } from '../../services/errorService';
import { sanitizeInput } from '../../utils/cryptoHelpers';
import TwoFactorInput from './TwoFactorInput';

// Enhanced validation schema with 2FA
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail-Adresse ist erforderlich')
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .max(254, 'E-Mail-Adresse ist zu lang')
    .refine((email) => isValidEmail(email), {
      message: 'Ungültiges E-Mail-Format',
    }),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein')
    .max(128, 'Passwort ist zu lang'),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormWith2FAProps {
  onSuccess?: () => void;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  showRegisterLink?: boolean;
}

const LoginFormWith2FA: React.FC<LoginFormWith2FAProps> = ({
  onSuccess,
  showRememberMe = true,
  showForgotPassword = true,
  showRegisterLink = true,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error, twoFactorRequired, pendingLoginCredentials } = useAppSelector(
    (state) => state.auth
  );
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Rate limiting configuration
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  // Clear errors and 2FA state when component mounts
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearTwoFactorState());
    return () => {
      dispatch(clearError());
      dispatch(clearTwoFactorState());
    };
  }, [dispatch]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: pendingLoginCredentials?.email || '',
      password: '',
      rememberMe: pendingLoginCredentials?.rememberMe || false,
    },
    mode: 'onBlur',
  });

  // Get redirect path from location state
  // const finalRedirectPath = location?.state?.from?.pathname || redirectPath;

  // Handle rate limiting
  useEffect(() => {
    const lockData = localStorage?.getItem('loginLock');
    if (lockData) {
      try {
        const { timestamp, attempts } = JSON.parse(lockData);
        if (typeof timestamp !== 'number' || typeof attempts !== 'number') {
          localStorage?.removeItem('loginLock');
          return;
        }
        const elapsed = Date.now() - timestamp;

        if (elapsed < LOCK_DURATION && attempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockTimeRemaining(LOCK_DURATION - elapsed);
          setAttemptCount(attempts);
        } else if (elapsed >= LOCK_DURATION) {
          localStorage?.removeItem('loginLock');
          setAttemptCount(0);
        } else {
          setAttemptCount(attempts || 0);
        }
      } catch (error) {
        console.error('Error parsing lock data:', error);
        localStorage?.removeItem('loginLock');
      }
    }
  }, [LOCK_DURATION]);

  // Lock countdown timer
  useEffect(() => {
    if (!isLocked || lockTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 1000) {
          setIsLocked(false);
          localStorage?.removeItem('loginLock');
          setAttemptCount(0);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTimeRemaining]);

  // Clear errors when user starts typing
  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  useEffect(() => {
    if (error && (watchedEmail || watchedPassword)) {
      dispatch(clearError());
    }
  }, [watchedEmail, watchedPassword, error, dispatch]);

  // Handle form submission
  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    if (isLocked) {
      setError('root', {
        message: 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte warten Sie.',
      });
      return;
    }

    try {
      clearErrors();
      setTwoFactorError(null);

      // Sanitize input data
      const sanitizedEmail = sanitizeInput(data.email.trim().toLowerCase());
      const sanitizedPassword = sanitizeInput(data.password);

      const result = await dispatch(
        login({
          email: sanitizedEmail,
          password: sanitizedPassword,
          rememberMe: data.rememberMe,
          twoFactorCode: data.twoFactorCode,
        })
      ).unwrap();

      if (result?.data.requires2FA) {
        // 2FA is required, component will show 2FA input
        return;
      }

      // Clear rate limiting on successful login
      localStorage.removeItem('loginLock');
      setAttemptCount(0);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Login form error:', error);
      errorService.handleError(error, 'Login failed', 'LoginForm');
      handleFailedAttempt();
    }
  };

  // Handle 2FA code submission
  const handle2FASubmit = async (code: string) => {
    if (!pendingLoginCredentials) {
      setTwoFactorError('Session expired. Please login again.');
      dispatch(clearTwoFactorState());
      return;
    }

    try {
      setTwoFactorError(null);

      const result = await dispatch(
        login({
          ...pendingLoginCredentials,
          twoFactorCode: code,
        })
      ).unwrap();

      if (result?.data.accessToken) {
        // Clear rate limiting on successful login
        localStorage.removeItem('loginLock');
        setAttemptCount(0);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      setTwoFactorError(error?.message || 'Invalid verification code');
      throw error; // Re-throw to handle in TwoFactorInput
    }
  };

  // Handle failed login attempts and rate limiting
  const handleFailedAttempt = () => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    const lockData = {
      timestamp: Date.now(),
      attempts: newAttemptCount,
    };
    localStorage.setItem('loginLock', JSON.stringify(lockData));

    if (newAttemptCount >= MAX_ATTEMPTS) {
      setIsLocked(true);
      setLockTimeRemaining(LOCK_DURATION);
      setError('root', {
        message: `Zu viele fehlgeschlagene Anmeldeversuche. Konto wurde für ${Math.ceil(
          LOCK_DURATION / 60000
        )} Minuten gesperrt.`,
      });
    } else {
      const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
      setError('root', {
        message: `Anmeldung fehlgeschlagen. Noch ${remainingAttempts} Versuche übrig.`,
      });
    }
  };

  // Format lock time remaining
  const formatLockTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if form has any errors
  const hasErrors = Object.keys(errors || {}).length > 0;

  // Show 2FA input if required
  if (twoFactorRequired) {
    return (
      <Fade in={true}>
        <Box>
          <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <SecurityIcon fontSize="large" />
              <Box>
                <Typography variant="h6">Two-Factor Authentication</Typography>
                <Typography variant="body2">
                  Enter the code from your authenticator app to continue
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <TwoFactorInput
            onSubmit={handle2FASubmit}
            onCancel={() => dispatch(clearTwoFactorState())}
            loading={isLoading}
            error={twoFactorError}
            title=""
            description="Enter your 6-digit authentication code"
          />
          
          <Box mt={3} textAlign="center">
            <Link
              component="button"
              variant="body2"
              onClick={() => dispatch(clearTwoFactorState())}
              sx={{ cursor: 'pointer' }}
            >
              Back to login
            </Link>
          </Box>
        </Box>
      </Fade>
    );
  }

  // Show regular login form
  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {/* Error Display */}
        {(error || errors.root) && (
          <Alert
            severity="error"
            onClose={() => dispatch(clearError())}
            sx={{ animation: 'fadeIn 0.3s ease-in' }}
          >
            {error?.message || errors.root?.message}
          </Alert>
        )}

        {/* Rate Limiting Warning */}
        {attemptCount > 0 && !isLocked && (
          <Alert severity="warning">
            {attemptCount >= 3
              ? `Achtung: Noch ${MAX_ATTEMPTS - attemptCount} Anmeldeversuche übrig.`
              : `${attemptCount} fehlgeschlagene Anmeldeversuche.`}
          </Alert>
        )}

        {/* Lock Status */}
        {isLocked && (
          <Alert severity="error">
            Konto temporär gesperrt. Versuchen Sie es in {formatLockTime(lockTimeRemaining)} erneut.
          </Alert>
        )}

        {/* Email Field */}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="E-Mail-Adresse"
              variant="outlined"
              fullWidth
              autoComplete="email"
              autoFocus
              disabled={isLoading || isLocked}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color={errors.email ? 'error' : 'action'} />
                  </InputAdornment>
                ),
                type: 'email',
              }}
            />
          )}
        />

        {/* Password Field */}
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Passwort"
              variant="outlined"
              fullWidth
              autoComplete="current-password"
              disabled={isLoading || isLocked}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color={errors.password ? 'error' : 'action'} />
                  </InputAdornment>
                ),
                type: showPassword ? 'text' : 'password',
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Passwort-Sichtbarkeit umschalten"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={isLoading || isLocked}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Remember Me Checkbox */}
        {showRememberMe && (
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                    color="primary"
                    disabled={isLoading || isLocked}
                  />
                }
                label={
                  <Typography variant="body2">
                    Angemeldet bleiben
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      (für 30 Tage)
                    </Typography>
                  </Typography>
                }
                sx={{ alignSelf: 'flex-start' }}
              />
            )}
          />
        )}

        {/* Submit Button */}
        <LoadingButton
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          loading={isLoading}
          disabled={isLocked || hasErrors}
          size="large"
          sx={{
            mt: 2,
            height: 48,
            fontWeight: 'bold',
          }}
        >
          {isLocked ? 'Gesperrt' : 'Anmelden'}
        </LoadingButton>
      </Stack>

      {/* Additional Links */}
      <Box sx={{ mt: 3 }}>
        {showForgotPassword && (
          <>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Passwort vergessen?
              </Link>
            </Box>

            {showRegisterLink && <Divider sx={{ my: 2 }} />}
          </>
        )}

        {showRegisterLink && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Noch kein Konto?{' '}
              <Link
                component={RouterLink}
                to="/auth/register"
                variant="body2"
                sx={{
                  fontWeight: 'medium',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Jetzt registrieren
              </Link>
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LoginFormWith2FA;