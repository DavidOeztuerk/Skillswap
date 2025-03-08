// src/pages/NotFoundPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import {
  SentimentDissatisfied as SadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

/**
 * 404 Nicht-gefunden-Seite
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Zurück zur vorherigen Seite
  };

  const handleGoHome = () => {
    navigate('/'); // Zur Startseite
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />

        <Typography variant="h2" component="h1" gutterBottom>
          404
        </Typography>

        <Typography variant="h5" component="h2" gutterBottom>
          Seite nicht gefunden
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Die angeforderte Seite existiert nicht oder ist nicht verfügbar.
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
          >
            Zurück
          </Button>

          <Button variant="contained" color="primary" onClick={handleGoHome}>
            Zur Startseite
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;
