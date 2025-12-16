import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Build as MaintenanceIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

interface MaintenanceModeProps {
  title?: string;
  message?: string;
  estimatedDuration?: string;
  startTime?: string;
  endTime?: string;
  showRefreshButton?: boolean;
  showHomeButton?: boolean;
  onRefresh?: () => void;
  onGoHome?: () => void;
  maintenanceFeatures?: string[];
}

const defaultMaintenanceFeatures = [
  'Verbesserung der Server-Performance',
  'Sicherheitsupdates installieren',
  'Neue Features vorbereiten',
  'Datenbank-Optimierungen',
];

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({
  title = 'Wartungsmodus',
  message = 'Wir führen gerade wichtige Wartungsarbeiten durch, um Ihnen eine bessere Erfahrung zu bieten.',
  estimatedDuration = 'ca. 30 Minuten',
  startTime,
  endTime,
  showRefreshButton = true,
  showHomeButton = true,
  onRefresh,
  onGoHome,
  maintenanceFeatures = defaultMaintenanceFeatures,
}) => {
  const handleRefresh = (): void => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = (): void => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <MaintenanceIcon sx={{ fontSize: 50 }} />
          </Box>
        </Box>

        <Typography variant="h3" component="h1" gutterBottom>
          {title}
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {estimatedDuration && (
            <Chip
              icon={<ScheduleIcon />}
              label={`Dauer: ${estimatedDuration}`}
              color="primary"
              variant="outlined"
            />
          )}
          {startTime && <Chip label={`Beginn: ${startTime}`} color="info" variant="outlined" />}
          {endTime && <Chip label={`Ende: ${endTime}`} color="success" variant="outlined" />}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {showRefreshButton && (
            <Button
              variant="contained"
              size="large"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Status prüfen
            </Button>
          )}
          {showHomeButton && (
            <Button
              variant="outlined"
              size="large"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
            >
              Zur Startseite
            </Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <MaintenanceIcon color="primary" sx={{ mr: 1 }} />
            Was wir gerade verbessern
          </Typography>
          <List>
            {maintenanceFeatures.map((feature, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={feature} slotProps={{ primary: { variant: 'body2' } }} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Vielen Dank für Ihr Verständnis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Wir entschuldigen uns für die Unannehmlichkeiten. Unsere Wartungsarbeiten sorgen dafür,
            dass SkillSwap für Sie noch schneller und zuverlässiger wird. Sie können diese Seite
            jederzeit aktualisieren, um zu prüfen, ob die Wartung abgeschlossen ist.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MaintenanceMode;
