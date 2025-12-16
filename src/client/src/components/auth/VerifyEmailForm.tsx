import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Stack, TextField } from '@mui/material';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useLoading } from '../../contexts/loadingContextHooks';
import { LoadingKeys } from '../../contexts/loadingContextValue';
import { LoadingButton } from '../ui/LoadingButton';
import authService from '../../api/services/authService';
import { useAppDispatch } from '../../store/store.hooks';
import { verifyEmail as verifyEmailAction } from '../../features/auth/authThunks';
import axios from 'axios';

const verifyEmailSchema = z.object({
  code: z.string().min(6, 'Der Verifizierungscode muss mindestens 6 Zeichen lang sein'),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

interface VerifyEmailFormProps {
  email?: string;
  onSuccess?: () => void;
  onResendSuccess?: () => void;
}

const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({ email, onSuccess, onResendSuccess }) => {
  const [searchParams] = useSearchParams();
  const { isLoading, withLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const dispatch = useAppDispatch();

  // Get email and token from URL params if available
  const urlEmail = searchParams.get('email') ?? email;
  const urlToken = searchParams.get('token');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: urlToken ?? '',
    },
  });

  // Handle verification - defined before useEffect that uses it
  const handleVerification = useCallback(
    async (code: string): Promise<void> => {
      await withLoading(LoadingKeys.VERIFY_EMAIL, async () => {
        try {
          setError(null);
          const result = await dispatch(
            verifyEmailAction({ email: urlEmail ?? '', verificationToken: code })
          );
          if (result.meta.requestStatus === 'fulfilled') {
            setIsVerified(true);
            if (onSuccess) {
              onSuccess();
            }
          } else {
            // Handle rejection
            const errorPayload = result.payload as { message?: string } | undefined;
            setError(
              errorPayload?.message ??
                'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code oder fordern Sie einen neuen an.'
            );
          }
        } catch (err: unknown) {
          console.error('Email verification failed:', err);
          if (axios.isAxiosError(err)) {
            const responseData = err.response?.data as { message?: string } | undefined;
            setError(
              responseData?.message ??
                'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code oder fordern Sie einen neuen an.'
            );
          } else {
            setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
          }
        }
      });
    },
    [withLoading, dispatch, urlEmail, onSuccess]
  );

  // Auto-verify if token is in URL
  useEffect(() => {
    if (urlToken && urlEmail) {
      setValue('code', urlToken);
      void handleVerification(urlToken);
    }
  }, [urlToken, urlEmail, setValue, handleVerification]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [cooldown]);

  const onSubmit: SubmitHandler<VerifyEmailFormValues> = async (data) => {
    await handleVerification(data.code);
  };

  const handleResendVerification = async (): Promise<void> => {
    if (cooldown > 0) return;

    await withLoading('resendVerification', async () => {
      try {
        setError(null);
        setResendMessage(null);
        await authService.resendEmailVerification(urlEmail ?? '');
        setResendMessage('Eine neue Verifizierungs-E-Mail wurde gesendet.');
        setCooldown(60);
        if (onResendSuccess) {
          onResendSuccess();
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const responseData = err.response?.data as { message?: string } | undefined;
          setError(responseData?.message ?? 'Fehler beim Senden der Verifizierungs-E-Mail.');
        } else {
          setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
        console.error('Resend verification failed:', err);
      }
    });
  };

  if (isVerified) {
    return (
      <Box sx={{ textAlign: 'center', maxWidth: 400, mx: 'auto', p: 3 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>
          E-Mail erfolgreich verifiziert
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          Ihre E-Mail-Adresse wurde erfolgreich verifiziert. Sie können sich jetzt anmelden.
        </Alert>
        <RouterLink to="/auth/login" style={{ textDecoration: 'none' }}>
          <LoadingButton variant="contained" color="primary" size="large">
            Zur Anmeldung
          </LoadingButton>
        </RouterLink>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            E-Mail verifizieren
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {urlEmail ? (
              <>
                Wir haben einen Verifizierungscode an <strong>{urlEmail}</strong> gesendet.
              </>
            ) : (
              'Geben Sie den Verifizierungscode aus Ihrer E-Mail ein.'
            )}
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            onClose={() => {
              setError(null);
            }}
          >
            {error}
          </Alert>
        )}

        {resendMessage && (
          <Alert
            severity="info"
            onClose={() => {
              setResendMessage(null);
            }}
          >
            {resendMessage}
          </Alert>
        )}

        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Verifizierungscode"
              variant="outlined"
              fullWidth
              placeholder="Geben Sie den 6-stelligen Code ein"
              error={errors.code !== undefined}
              helperText={errors.code?.message}
              disabled={isLoading(LoadingKeys.VERIFY_EMAIL)}
              slotProps={{
                htmlInput: {
                  maxLength: 10,
                  style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' },
                },
              }}
            />
          )}
        />

        <LoadingButton
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          loading={isLoading(LoadingKeys.VERIFY_EMAIL)}
          size="large"
        >
          E-Mail verifizieren
        </LoadingButton>

        <Stack direction="row" spacing={2} justifyContent="center">
          <LoadingButton
            onClick={() => {
              void handleResendVerification();
            }}
            variant="text"
            startIcon={<RefreshIcon />}
            disabled={cooldown > 0 || !urlEmail}
            loading={isLoading('resendVerification')}
          >
            {cooldown > 0 ? `Erneut senden (${String(cooldown)}s)` : 'Code erneut senden'}
          </LoadingButton>

          <RouterLink to="/auth/login" style={{ textDecoration: 'none' }}>
            <LoadingButton variant="text">Zurück zur Anmeldung</LoadingButton>
          </RouterLink>
        </Stack>
      </Stack>
    </Box>
  );
};

export default VerifyEmailForm;
