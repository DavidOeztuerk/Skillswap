import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import { LoadingButton } from '../ui/LoadingButton';
import { errorService } from '../../services/errorService';
import { sanitizeInput } from '../../utils/cryptoHelpers';
import TwoFactorInput from './TwoFactorInput';
import ErrorAlert from '../error/ErrorAlert';
import {
  isSuccessResponse,
  type SuccessResponse,
  type ErrorResponse,
} from '../../types/api/UnifiedResponse';
import type { LoginResponse } from '../../types/contracts/responses/AuthResponse';
import { useLoading } from '../../contexts/loadingContextHooks';
import { useAppDispatch } from '../../store/store.hooks';
import { login as loginAction } from '../../features/auth/authThunks';
import type { LoginRequest } from '../../types/contracts/requests/LoginRequest';

// Loading key constant
const LOADING_KEY_LOGIN = 'auth.login';

// Type for thunk result
interface ThunkResult {
  meta: { requestStatus: 'fulfilled' | 'rejected' | 'pending' };
  payload?: SuccessResponse<LoginResponse> | ErrorResponse;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LOCK_STORAGE_KEY = 'loginLock';

// Debug flag - nur in Development loggen
const DEBUG = import.meta.env.DEV;

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const loginSchema = z.object({
  email: z.email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein')
    .max(128, 'Passwort ist zu lang'),
  rememberMe: z.boolean(),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ============================================================================
// INTERFACES
// ============================================================================

interface LoginFormWith2FAProps {
  onSuccess?: () => void;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  showRegisterLink?: boolean;
}

interface LockData {
  timestamp: number;
  attempts: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Type guard for LockData validation
 */
const isLockData = (value: unknown): value is LockData => {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.timestamp === 'number' && typeof obj.attempts === 'number';
};

/**
 * Safely get lock data from localStorage (SSR-safe)
 */
const getLockData = (): LockData | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const data = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!data) return null;

    const parsed: unknown = JSON.parse(data);
    if (!isLockData(parsed)) {
      localStorage.removeItem(LOCK_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(LOCK_STORAGE_KEY);
    return null;
  }
};

/**
 * Save lock data to localStorage (SSR-safe)
 */
const saveLockData = (data: LockData): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(data));
};

/**
 * Clear lock data from localStorage (SSR-safe)
 */
const clearLockData = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(LOCK_STORAGE_KEY);
};

/**
 * Format remaining lock time as MM:SS
 */
const formatLockTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(minutes)}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Compute initial rate limiting state from localStorage
 * Used for lazy state initialization to avoid useEffect setState
 */
const getInitialLockState = (): {
  attemptCount: number;
  isLocked: boolean;
  lockTimeRemaining: number;
} => {
  const lockData = getLockData();
  if (!lockData) {
    return { attemptCount: 0, isLocked: false, lockTimeRemaining: 0 };
  }

  const elapsed = Date.now() - lockData.timestamp;

  if (elapsed >= LOCK_DURATION_MS) {
    // Lock expired
    clearLockData();
    return { attemptCount: 0, isLocked: false, lockTimeRemaining: 0 };
  }

  if (lockData.attempts >= MAX_ATTEMPTS) {
    // Still locked
    return {
      attemptCount: lockData.attempts,
      isLocked: true,
      lockTimeRemaining: LOCK_DURATION_MS - elapsed,
    };
  }

  // Has attempts but not locked
  return { attemptCount: lockData.attempts, isLocked: false, lockTimeRemaining: 0 };
};

// ============================================================================
// COMPONENT
// ============================================================================

const LoginFormWith2FA: React.FC<LoginFormWith2FAProps> = ({
  onSuccess,
  showRememberMe = true,
  showForgotPassword = true,
  showRegisterLink = true,
}) => {
  // ─────────────────────────────────────────────────────────────────────────
  // HOOKS
  // ─────────────────────────────────────────────────────────────────────────

  const dispatch = useAppDispatch();

  const {
    isLoading: authLoading,
    errorMessage,
    clearError,
    clearTwoFactorState,
    pendingLoginCredentials,
  } = useAuth();

  const { withLoading, isLoading: checkLoading } = useLoading();

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL STATE
  // ─────────────────────────────────────────────────────────────────────────

  const [showPassword, setShowPassword] = useState(false);
  // Use lazy initialization to avoid useEffect setState
  const [attemptCount, setAttemptCount] = useState(() => getInitialLockState().attemptCount);
  const [isLocked, setIsLocked] = useState(() => getInitialLockState().isLocked);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(
    () => getInitialLockState().lockTimeRemaining
  );
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────────────────

  const mountedRef = useRef(true);
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────────────────────────────────

  const loginLoading = authLoading || checkLoading(LOADING_KEY_LOGIN);

  // ─────────────────────────────────────────────────────────────────────────
  // FORM
  // ─────────────────────────────────────────────────────────────────────────

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: pendingLoginCredentials?.email ?? '',
      password: pendingLoginCredentials?.password ?? '',
      rememberMe: pendingLoginCredentials?.rememberMe ?? false,
      twoFactorCode: pendingLoginCredentials?.twoFactorCode ?? '',
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    clearError();

    return () => {
      mountedRef.current = false;
      clearError();
      clearTwoFactorState();
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
      }
    };
  }, [clearError, clearTwoFactorState]);

  // Lock countdown timer
  useEffect(() => {
    if (!isLocked || lockTimeRemaining <= 0) return;

    lockTimerRef.current = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 1000) {
          setIsLocked(false);
          clearLockData();
          setAttemptCount(0);
          if (lockTimerRef.current) {
            clearInterval(lockTimerRef.current);
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
      }
    };
  }, [isLocked, lockTimeRemaining]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a failed login attempt
   */
  const handleFailedAttempt = useCallback(() => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);

    saveLockData({
      timestamp: Date.now(),
      attempts: newCount,
    });

    if (newCount >= MAX_ATTEMPTS) {
      setIsLocked(true);
      setLockTimeRemaining(LOCK_DURATION_MS);
      setError('root', {
        message: `Zu viele fehlgeschlagene Anmeldeversuche. Konto wurde für ${String(
          Math.ceil(LOCK_DURATION_MS / 60000)
        )} Minuten gesperrt.`,
      });
    }
  }, [attemptCount, setError]);

  /**
   * Clear rate limiting after successful login
   */
  const handleSuccessfulLogin = useCallback(() => {
    clearLockData();
    setAttemptCount(0);
    onSuccess?.();
  }, [onSuccess]);

  /**
   * Perform login dispatch and return typed result
   */
  const performLogin = async (credentials: LoginRequest): Promise<ThunkResult> => {
    const result = await dispatch(loginAction(credentials));
    return result as unknown as ThunkResult;
  };

  /**
   * Handle form submission
   */
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

      // Sanitize input
      const sanitizedEmail = sanitizeInput(data.email.trim().toLowerCase());
      const sanitizedPassword = sanitizeInput(data.password);

      const credentials: LoginRequest = {
        email: sanitizedEmail,
        password: sanitizedPassword,
        rememberMe: data.rememberMe,
        ...(data.twoFactorCode !== undefined &&
          data.twoFactorCode !== '' && { twoFactorCode: data.twoFactorCode }),
      };

      const result = await withLoading(LOADING_KEY_LOGIN, () => performLogin(credentials));

      if (result.meta.requestStatus === 'fulfilled' && result.payload !== undefined) {
        const payload = result.payload as SuccessResponse<LoginResponse> | undefined;

        if (payload && isSuccessResponse(payload)) {
          const loginData = payload.data;

          if (DEBUG) {
            console.debug('🔐 Login response:', {
              requires2FA: loginData.requires2FA,
              hasAccessToken: loginData.accessToken.length > 0,
            });
          }

          // Check if 2FA is required
          if (loginData.requires2FA) {
            // 2FA required - component will show 2FA input via pendingLoginCredentials
            return;
          }

          // Login successful - accessToken vorhanden
          if (loginData.accessToken.length > 0) {
            handleSuccessfulLogin();
            return;
          }
        }
      }

      // Login failed oder kein accessToken
      handleFailedAttempt();
    } catch (error: unknown) {
      if (DEBUG) {
        console.error('Login form error:', error);
      }
      errorService.handleError(error, 'Login failed', 'LoginForm');
      handleFailedAttempt();
    }
  };

  /**
   * Handle 2FA code submission
   */
  const handle2FASubmit = async (code: string): Promise<void> => {
    if (!pendingLoginCredentials) {
      setTwoFactorError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
      clearTwoFactorState();
      return;
    }

    try {
      setTwoFactorError(null);

      const result = await performLogin({
        ...pendingLoginCredentials,
        twoFactorCode: code,
      });

      if (result.meta.requestStatus === 'fulfilled' && result.payload !== undefined) {
        const payload = result.payload as SuccessResponse<LoginResponse> | undefined;

        if (payload && isSuccessResponse(payload)) {
          const loginData = payload.data;

          if (loginData.accessToken.length > 0) {
            handleSuccessfulLogin();
            return;
          }
        }

        // Kein accessToken in Response
        setTwoFactorError('Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      } else {
        // rejected
        setTwoFactorError('Ungültiger Code. Bitte versuchen Sie es erneut.');
        handleFailedAttempt();
      }
    } catch (error: unknown) {
      if (DEBUG) {
        console.error('2FA verification error:', error);
      }
      const errorMsg = error instanceof Error ? error.message : 'Verifizierung fehlgeschlagen.';
      setTwoFactorError(errorMsg);
      handleFailedAttempt();
    }
  };

  /**
   * Cancel 2FA and return to login form
   */
  const handleCancel2FA = useCallback(() => {
    clearTwoFactorState();
    setTwoFactorError(null);
  }, [clearTwoFactorState]);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  // Check for validation errors (exclude root errors which are API errors)
  const hasValidationErrors = Object.keys(errors).filter((key) => key !== 'root').length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - 2FA INPUT
  // ─────────────────────────────────────────────────────────────────────────

  // ✅ KORREKT: Check pendingLoginCredentials für 2FA-Anzeige (nicht user?.preferences!)
  if (pendingLoginCredentials) {
    return (
      <Fade in>
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <SecurityIcon fontSize="large" />
              <Box>
                <Typography variant="h6">Zwei-Faktor-Authentifizierung</Typography>
                <Typography variant="body2">
                  Geben Sie den Code aus Ihrer Authenticator-App ein
                </Typography>
              </Box>
            </Box>
          </Paper>

          <TwoFactorInput
            onSubmit={handle2FASubmit}
            onCancel={handleCancel2FA}
            loading={loginLoading}
            error={twoFactorError}
            title=""
            description="Geben Sie Ihren 6-stelligen Authentifizierungscode ein"
          />

          <Box mt={3} textAlign="center">
            <Link
              component="button"
              variant="body2"
              onClick={handleCancel2FA}
              sx={{ cursor: 'pointer' }}
            >
              Zurück zur Anmeldung
            </Link>
          </Box>
        </Box>
      </Fade>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - LOGIN FORM
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {/* Error Display */}
        <ErrorAlert
          error={errorMessage ?? (errors.root ? { message: errors.root.message } : undefined)}
          onDismiss={clearError}
          compact={import.meta.env.PROD}
        />

        {/* Rate Limiting Warning */}
        {attemptCount > 0 && !isLocked && (
          <Alert severity="warning">
            {attemptCount >= 3
              ? `Achtung: Noch ${String(MAX_ATTEMPTS - attemptCount)} Anmeldeversuche übrig.`
              : `${String(attemptCount)} fehlgeschlagene Anmeldeversuche.`}
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
              disabled={loginLoading || isLocked}
              error={!!errors.email}
              helperText={errors.email?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color={errors.email ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  type: 'email',
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
              disabled={loginLoading || isLocked}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
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
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        edge="end"
                        disabled={loginLoading || isLocked}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        {/* Remember Me */}
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
                    disabled={loginLoading || isLocked}
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
          loading={loginLoading}
          disabled={isLocked || hasValidationErrors}
          loadingText="Anmeldung läuft..."
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
