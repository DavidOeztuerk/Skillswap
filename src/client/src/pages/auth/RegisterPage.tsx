// src/pages/auth/RegisterPage.tsx
import React from 'react';
import { Container, Paper, Box, Typography, Link } from '@mui/material';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuth } from '../../hooks/useAuth';

/**
 * Registrierungs-Seite der Anwendung
 */
const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Wenn der Benutzer bereits angemeldet ist, zum Dashboard weiterleiten
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Neues Konto erstellen
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tritt der SkillShare-Community bei und beginne zu lernen und zu
            lehren
          </Typography>
        </Box>

        <RegisterForm />

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2">
            Bereits ein Konto?{' '}
            <Link component={RouterLink} to="/login">
              Anmelden
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
