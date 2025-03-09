// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import LoadingButton from '../ui/LoadingButton';

// Validierungsschema mit Zod
const loginSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z
    .string()
    .min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectPath = '/dashboard',
}) => {
  const { login, isLoading, error, dismissError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // React Hook Form mit Zod-Resolver
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const success = await login(data, redirectPath);
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Fehler wird bereits vom useAuth-Hook erfasst
      console.error('Login failed:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={dismissError}>
            {error}
          </Alert>
        )}

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

        <LoadingButton
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          loading={isLoading}
          size="large"
          sx={{ mt: 2 }}
        >
          Anmelden
        </LoadingButton>
      </Stack>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          Noch kein Konto?{' '}
          <Link component={RouterLink} to="/register" variant="body2">
            Jetzt registrieren
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
