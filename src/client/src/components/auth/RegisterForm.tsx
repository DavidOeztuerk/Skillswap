import React, { useState, useEffect } from 'react';
import { Box, Typography, Link, IconButton, Alert, Stack, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../hooks/useAuth';
import LoadingButton from '../ui/LoadingButton';
import { InputAdornment, TextField } from '@mui/material';

// Validierungsschema mit Zod
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Der Vorname muss mindestens 2 Zeichen lang sein'),
    lastName: z
      .string()
      .min(2, 'Der Nachname muss mindestens 2 Zeichen lang sein'),
    userName: z
      .string()
      .min(3, 'Der Benutzername muss mindestens 3 Zeichen lang sein')
      .max(20, 'Der Benutzername darf maximal 20 Zeichen lang sein')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Der Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten'
      ),
    email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
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
  redirectPath = '/dashboard',
}) => {
  const { register: registerUser, isLoading, error, dismissError } = useAuth();
  
  // Clear errors when component mounts
  useEffect(() => {
    dismissError?.();
    return () => {
      // Clear errors when component unmounts  
      dismissError?.();
    };
  }, [dismissError]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
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
    try {
      const { ...userData } = data;
      const success = await registerUser(userData, redirectPath);
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={dismissError}>
            {error?.message}
          </Alert>
        )}

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
                  error={!!errors?.firstName}
                  helperText={errors?.firstName?.message}
                  disabled={isLoading}
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
                  error={!!errors?.lastName}
                  helperText={errors?.lastName?.message}
                  disabled={isLoading}
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
              error={!!errors?.userName}
              helperText={errors?.userName?.message}
              disabled={isLoading}
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
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isLoading}
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
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isLoading}
              slotProps={{
                input: {
                  type: showPassword ? 'text' : 'password',
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Passwort-Sichtbarkeit umschalten"
                        onClick={() => setShowPassword(!showPassword)}
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
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={isLoading}
              slotProps={{
                input: {
                  type: showConfirmPassword ? 'text' : 'password',
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Passwort-Bestätigung-Sichtbarkeit umschalten"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
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
          loading={isLoading}
          size="large"
          sx={{ mt: 2 }}
        >
          Registrieren
        </LoadingButton>
      </Stack>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          Bereits ein Konto?{' '}
          <Link component={RouterLink} to="/login" variant="body2">
            Hier anmelden
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;
