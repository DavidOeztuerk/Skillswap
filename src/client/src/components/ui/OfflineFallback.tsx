import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface OfflineFallbackProps {
  variant?: 'full' | 'compact' | 'banner';
  title?: string;
  message?: string;
  showRefreshButton?: boolean;
  showTips?: boolean;
  onRefresh?: () => void;
}

const offlineTips = [
  'Ihre bereits geladenen Daten bleiben weiterhin verfügbar',
  'Unsere App kann einige Funktionen auch offline bereitstellen',
  'Sobald Sie wieder online sind, werden alle Änderungen synchronisiert',
  'Versuchen Sie, näher zum WLAN-Router zu gehen',
  'Überprüfen Sie Ihre mobile Datenverbindung',
];

const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  variant = 'full',
  title = 'Offline-Modus',
  message = 'Sie sind momentan nicht mit dem Internet verbunden.',
  showRefreshButton = true,
  showTips = true,
  onRefresh,
}) => {
  const handleRefresh = (): void => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  if (variant === 'banner') {
    return (
      <Alert
        severity="warning"
        icon={<OfflineIcon />}
        action={
          showRefreshButton && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Aktualisieren
            </Button>
          )
        }
      >
        <Typography variant="body2">
          <strong>{title}:</strong> {message}
        </Typography>
      </Alert>
    );
  }

  if (variant === 'compact') {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'warning.light',
                color: 'warning.contrastText',
              }}
            >
              <OfflineIcon fontSize="large" />
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>

          {showRefreshButton && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Verbindung prüfen
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant
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
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
            }}
          >
            <OfflineIcon sx={{ fontSize: 50 }} />
          </Box>
        </Box>

        <Typography variant="h3" component="h1" gutterBottom>
          {title}
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          {message}
        </Typography>

        {showRefreshButton && (
          <Button
            variant="contained"
            size="large"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mb: 4 }}
          >
            Verbindung erneut prüfen
          </Button>
        )}
      </Box>

      {showTips && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Offline-Features</Typography>
              </Box>
              <List dense>
                {offlineTips.slice(0, 3).map((tip, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={tip} slotProps={{ primary: { variant: 'body2' } }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RefreshIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Verbindung wiederherstellen</Typography>
              </Box>
              <List dense>
                {offlineTips.slice(3).map((tip, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={tip} slotProps={{ primary: { variant: 'body2' } }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default OfflineFallback;
