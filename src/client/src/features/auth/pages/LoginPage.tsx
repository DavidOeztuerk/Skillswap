import React, { useEffect } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { Container, Paper, Box, Typography } from '@mui/material';
import LoginFormWith2FA from '../components/LoginFormWith2Fa';
import { useAuth } from '../hooks/useAuth';

/**
 * Type for location state passed from protected routes or skill detail page
 */
interface LoginLocationState {
  from?: Location;
  action?: 'createMatch';
  skillId?: string;
}

/**
 * Login-Seite der Anwendung
 * Unterstützt Return-URL nach erfolgreichem Login
 */
const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get return destination from location state
  const locationState = location.state as LoginLocationState | null;
  const from = locationState?.from;
  const action = locationState?.action;

  // Handle redirect after successful login
  useEffect(() => {
    const handleRedirect = async (): Promise<void> => {
      if (isAuthenticated && !isLoading) {
        if (from?.pathname) {
          // Build return URL with action parameter if needed
          const returnPath =
            action === 'createMatch' ? `${from.pathname}?showMatchForm=true` : from.pathname;

          console.debug('🔐 LoginPage: Redirecting to return URL:', returnPath);
          await navigate(returnPath, { replace: true });
        } else {
          // Default redirect to dashboard
          await navigate('/dashboard', { replace: true });
        }
      }
    };

    handleRedirect().catch((error: unknown) => {
      console.error('LoginPage redirect error:', error);
    });
  }, [action, from, isAuthenticated, isLoading, navigate]);

  // Show nothing while redirecting (useEffect handles navigation)
  if (isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Willkommen zurück
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Melde dich bei deinem SkillSwap-Konto an
          </Typography>
        </Box>

        <LoginFormWith2FA />
      </Paper>
    </Container>
  );
};

export default LoginPage;
