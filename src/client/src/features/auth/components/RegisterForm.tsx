import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Typography,
  Link,
  IconButton,
  Stack,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useLoading } from '../../../core/contexts/loadingContextHooks';
import { LoadingKeys } from '../../../core/contexts/loadingContextValue';
import ErrorAlert from '../../../shared/components/error/ErrorAlert';
import useAuth from '../hooks/useAuth';

// Validierungsschema mit Zod
const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Der Vorname muss mindestens 2 Zeichen lang sein'),
    lastName: z.string().min(2, 'Der Nachname muss mindestens 2 Zeichen lang sein'),
    userName: z
      .string()
      .min(3, 'Der Benutzername muss mindestens 3 Zeichen lang sein')
      .max(20, 'Der Benutzername darf maximal 20 Zeichen lang sein')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Der Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten'
      ),
    email: z.email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
    password: z
      .string()
      .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Das Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  // redirectPath is handled by auth slice, kept for API compatibility
  redirectPath: _redirectPath = '/dashboard',
}) => {
  const { register: registerUser, errorMessage, dismissError } = useAuth();
  const { isLoading, withLoading } = useLoading();

  // // Clear errors when component mounts
  // useEffect(() => {
  //   dismissError?.();
  //   return () => {
  //     // Clear errors when component unmounts
  //     dismissError?.();
  //   };
  // }, [dismissError]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit', // Only validate on form submit, not on blur/change
    shouldUnregister: true, // Unregister fields on unmount
    defaultValues: {
      firstName: '',
      lastName: '',
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    await withLoading(LoadingKeys.REGISTER, () => {
      // Register user (navigation is handled by the auth slice)
      registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        email: data.email,
        password: data.password,
      });
      // Note: onSuccess callback can be called after successful registration
      // but we can't easily detect success here since registerUser returns void
      // The auth slice handles navigation on successful registration
      onSuccess?.();
      return Promise.resolve();
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        <ErrorAlert
          error={errorMessage ?? (errors.root ? { message: errors.root.message } : undefined)}
          onDismiss={() => {
            dismissError();
          }}
          compact={import.meta.env.PROD}
        />

        {/* Vorname + Nachname */}
        <Grid container columns={12} spacing={1}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Vorname"
                  variant="outlined"
                  fullWidth
                  autoComplete="given-name"
                  error={errors.firstName !== undefined}
                  helperText={errors.firstName?.message}
                  disabled={isLoading(LoadingKeys.REGISTER)}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nachname"
                  variant="outlined"
                  fullWidth
                  autoComplete="family-name"
                  error={errors.lastName !== undefined}
                  helperText={errors.lastName?.message}
                  disabled={isLoading(LoadingKeys.REGISTER)}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Benutzername */}
        <Controller
          name="userName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Benutzername"
              variant="outlined"
              fullWidth
              autoComplete="username"
              error={errors.userName !== undefined}
              helperText={errors.userName?.message}
              disabled={isLoading(LoadingKeys.REGISTER)}
            />
          )}
        />

        {/* E-Mail */}
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
              error={errors.email !== undefined}
              helperText={errors.email?.message}
              disabled={isLoading(LoadingKeys.REGISTER)}
              slotProps={{
                input: {
                  type: 'email',
                },
              }}
            />
          )}
        />

        {/* Passwort */}
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Passwort"
              variant="outlined"
              fullWidth
              autoComplete="new-password"
              error={errors.password !== undefined}
              helperText={errors.password?.message}
              disabled={isLoading(LoadingKeys.REGISTER)}
              slotProps={{
                input: {
                  type: showPassword ? 'text' : 'password',
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Passwort-Sichtbarkeit umschalten"
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        edge="end"
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

        {/* Passwort bestätigen */}
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Passwort bestätigen"
              variant="outlined"
              fullWidth
              autoComplete="new-password"
              error={errors.confirmPassword !== undefined}
              helperText={errors.confirmPassword?.message}
              disabled={isLoading(LoadingKeys.REGISTER)}
              slotProps={{
                input: {
                  type: showConfirmPassword ? 'text' : 'password',
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Passwort-Bestätigung-Sichtbarkeit umschalten"
                        onClick={() => {
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
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
          loading={isLoading(LoadingKeys.REGISTER)}
          disabled={
            isLoading(LoadingKeys.REGISTER) || Object.keys(errors).some((key) => key !== 'root')
          }
          size="large"
          sx={{ mt: 2 }}
        >
          Registrieren
        </LoadingButton>
      </Stack>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          Bereits ein Konto?{' '}
          <Link component={RouterLink} to="/auth/login" variant="body2">
            Hier anmelden
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;
