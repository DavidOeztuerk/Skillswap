import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Stack, TextField } from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useLoading, LoadingKeys } from '../../contexts/LoadingContext';
import { LoadingButton } from '../../components/common/LoadingButton';
import authService from '../../api/services/authService';
import { useAuth } from '../../hooks/useAuth';
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

const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({ 
  email, 
  onSuccess, 
  onResendSuccess 
}) => {
  const [searchParams] = useSearchParams();
  const { isLoading, withLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { verifyEmail } = useAuth();

  // Get email and token from URL params if available
  const urlEmail = searchParams.get('email') || email;
  const urlToken = searchParams.get('token');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: urlToken || '',
    },
  });

  // Auto-verify if token is in URL
  useEffect(() => {
    if (urlToken && urlEmail) {
      setValue('code', urlToken);
      handleVerification(urlToken);
    }
  }, [urlToken, urlEmail]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerification = async (code: string) => {
    await withLoading(LoadingKeys.VERIFY_EMAIL, async () => {
      try {
        setError(null);
        await verifyEmail({ email: urlEmail ?? "", verificationToken: code })
        setIsVerified(true);
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        console.error('Email verification failed:', err);
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
            'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code oder fordern Sie einen neuen an.'
          );
        } else {
          setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
      }
    });
  };

  const onSubmit: SubmitHandler<VerifyEmailFormValues> = async (data) => {
    await handleVerification(data.code);
  };

  const handleResendVerification = async (code: string) => {
    if (cooldown > 0) return;

    await withLoading('resendVerification', async () => {
      try {
        setError(null);
        setResendMessage(null);
        await authService.verifyEmail({ email: urlEmail || "", verificationToken: code});
        setResendMessage('Eine neue Verifizierungs-E-Mail wurde gesendet.');
        setCooldown(60);
        if (onResendSuccess) {
          onResendSuccess();
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
            'Fehler beim Senden der Verifizierungs-E-Mail.'
          );
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
          <LoadingButton
            variant="contained"
            color="primary"
            size="large"
          >
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
              <>Wir haben einen Verifizierungscode an <strong>{urlEmail}</strong> gesendet.</>
            ) : (
              'Geben Sie den Verifizierungscode aus Ihrer E-Mail ein.'
            )}
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {resendMessage && (
          <Alert severity="info" onClose={() => setResendMessage(null)}>
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
              autoFocus
              placeholder="Geben Sie den 6-stelligen Code ein"
              error={!!errors?.code}
              helperText={errors?.code?.message}
              disabled={isLoading(LoadingKeys.VERIFY_EMAIL)}
              inputProps={{
                maxLength: 10,
                style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }
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
            onClick={() => handleResendVerification(urlToken ?? "")}
            variant="text"
            startIcon={<RefreshIcon />}
            disabled={cooldown > 0 || !urlEmail}
            loading={isLoading('resendVerification')}
          >
            {cooldown > 0 ? `Erneut senden (${cooldown}s)` : 'Code erneut senden'}
          </LoadingButton>

          <RouterLink to="/auth/login" style={{ textDecoration: 'none' }}>
            <LoadingButton
              variant="text"
            >
              Zurück zur Anmeldung
            </LoadingButton>
          </RouterLink>
        </Stack>
      </Stack>
    </Box>
  );
};

export default VerifyEmailForm;