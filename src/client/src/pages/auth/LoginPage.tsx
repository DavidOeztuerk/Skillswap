import React from 'react';
import { Container, Paper, Box, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

/**
 * Login-Seite der Anwendung
 */
const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Wenn der Benutzer bereits angemeldet ist, zum Dashboard weiterleiten
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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

        <LoginForm />
      </Paper>
    </Container>
  );
};

export default LoginPage;
