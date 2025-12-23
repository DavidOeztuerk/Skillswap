import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock as LockIcon } from '@mui/icons-material';
import { Container, Typography, Button, Box, Paper } from '@mui/material';

/**
 * Unauthorized Page - shown when user lacks required permissions
 */
const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = (): void => {
    void navigate(-1);
  };

  const handleGoHome = (): void => {
    void navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <LockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom color="error">
            Nicht berechtigt
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sie haben keine Berechtigung, diese Seite zu besuchen. Wenden Sie sich an einen
            Administrator, wenn Sie glauben, dass dies ein Fehler ist.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleGoBack} sx={{ minWidth: 120 }}>
            Zurück
          </Button>
          <Button variant="contained" onClick={handleGoHome} sx={{ minWidth: 120 }}>
            Zur Startseite
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default UnauthorizedPage;
