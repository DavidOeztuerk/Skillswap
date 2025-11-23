import React, { useState } from 'react';
import { Box, Typography, Alert, Stack, TextField } from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLoading, LoadingKeys } from '../../contexts/LoadingContext';
import { LoadingButton } from '../../components/common/LoadingButton';
import { useAppDispatch } from '../../store/store.hooks';
import { requestPasswordReset } from '../../features/auth/authThunks';
import EnhancedErrorAlert from '../error/EnhancedErrorAlert';

const forgotPasswordSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
  const { isLoading, withLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    await withLoading(LoadingKeys.RESET_PASSWORD, async () => {
      try {
        setError(null);
        dispatch(requestPasswordReset(data.email));
        setIsSubmitted(true);
        if (onSuccess) {
          onSuccess(data.email);
        }
      } catch (err: unknown) {
        console.error('Password reset request failed:', err);
        let errorMessage = 'Fehler beim Senden der Passwort-Reset-E-Mail. Bitte versuchen Sie es später erneut.';
        if (err && typeof err === 'object' && 'response' in err) {
          const responseError = err as { response?: { data?: { message?: string } } };
          errorMessage = responseError.response?.data?.message || errorMessage;
        }
        setError(errorMessage);
      }
    });
  };

  if (isSubmitted) {
    return (
      <Box sx={{ textAlign: 'center', maxWidth: 400, mx: 'auto', p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          E-Mail gesendet
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          Wir haben Ihnen eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts an {getValues('email')} gesendet.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Bitte überprüfen Sie Ihr E-Mail-Postfach (auch den Spam-Ordner) und folgen Sie den Anweisungen in der E-Mail.
        </Typography>
        <RouterLink to="/auth/login" style={{ textDecoration: 'none' }}>
          <LoadingButton
            variant="outlined"
            startIcon={<ArrowBackIcon />}
          >
            Zurück zur Anmeldung
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
            Passwort vergessen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
          </Typography>
        </Box>

        <EnhancedErrorAlert 
          error={error ? { message: error } : (errors.root && { message: errors.root.message })}
          onDismiss={() => setError(null)}
          compact={process.env.NODE_ENV === 'production'}
        />

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
              error={!!errors?.email}
              helperText={errors?.email?.message}
              disabled={isLoading(LoadingKeys.RESET_PASSWORD)}
              slotProps={{
                input: {
                  type: 'email',
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
          loading={isLoading(LoadingKeys.RESET_PASSWORD)}
          disabled={isLoading(LoadingKeys.RESET_PASSWORD) || Object.keys(errors).filter(key => key !== 'root').length > 0}
          size="large"
          sx={{ mt: 2 }}
        >
          Passwort-Reset-E-Mail senden
        </LoadingButton>

        <RouterLink to="/auth/login" style={{ textDecoration: 'none', alignSelf: 'center' }}>
          <LoadingButton
            variant="text"
            startIcon={<ArrowBackIcon />}
          >
            Zurück zur Anmeldung
          </LoadingButton>
        </RouterLink>
      </Stack>
    </Box>
  );
};

export default ForgotPasswordForm;