// src/components/auth/LoginForm.tsx
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
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import LoadingButton from '../ui/LoadingButton';
import { isValidEmail } from '../../utils/validators';
import { errorService } from '../../services/errorService';
import { generateSecureToken, sanitizeInput } from '../../utils/cryptoHelpers';

// Enhanced validation schema
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
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  showRegisterLink?: boolean;
}

/**
 * Perfect Login Form Component with comprehensive validation,
 * error handling, accessibility, and security features
 */
const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectPath = '/dashboard',
  showRememberMe = true,
  showForgotPassword = true,
  showRegisterLink = true,
}) => {
  const { login, isLoading, error, dismissError } = useAuth();
  
  // Clear errors when component mounts
  useEffect(() => {
    dismissError?.();
    return () => {
      // Clear errors when component unmounts
      dismissError?.();
    };
  }, [dismissError]);
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  // Rate limiting configuration
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

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
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Get redirect path from location state
  const finalRedirectPath = location?.state?.from?.pathname || redirectPath;

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
        // Clear lock if duration has passed
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
      dismissError?.();
    }
  }, [watchedEmail, watchedPassword, error, dismissError]);

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

      // Sanitize input data
      const sanitizedEmail = sanitizeInput(data.email.trim().toLowerCase());
      const sanitizedPassword = sanitizeInput(data.password);

      // Generate CSRF token for additional security
      const csrfToken = generateSecureToken(16);

      const success = await login(
        {
          email: sanitizedEmail,
          password: sanitizedPassword,
          rememberMe: data.rememberMe,
          csrfToken, // Add CSRF token to request
        },
        finalRedirectPath
      );

      if (success) {
        // Clear rate limiting on successful login
        localStorage.removeItem('loginLock');
        setAttemptCount(0);

        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle failed login attempt
        handleFailedAttempt();
      }
    } catch (error) {
      console.error('Login form error:', error);
      errorService.handleError(error, 'Login failed', 'LoginForm');
      handleFailedAttempt();
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
        message: `Zu viele fehlgeschlagene Anmeldeversuche. Konto wurde für ${Math.ceil(LOCK_DURATION / 60000)} Minuten gesperrt.`,
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

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {/* Error Display */}
        {(error || errors.root) && (
          <Alert
            severity="error"
            onClose={dismissError}
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
            Konto temporär gesperrt. Versuchen Sie es in{' '}
            {formatLockTime(lockTimeRemaining)} erneut.
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: errors.email ? 'error.main' : 'primary.main',
                    },
                  },
                },
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: errors.password
                        ? 'error.main'
                        : 'primary.main',
                    },
                  },
                },
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
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
            },
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

export default LoginForm;
