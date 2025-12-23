import React from 'react';
import {
  SignalCellular0Bar as SignalLowIcon,
  SignalCellular1Bar as SignalMediumLowIcon,
  SignalCellular3Bar as SignalMediumIcon,
  SignalCellular4Bar as SignalHighIcon,
  SignalCellularConnectedNoInternet0Bar as NoInternetIcon,
} from '@mui/icons-material';
import { Box, Chip, CircularProgress, useTheme } from '@mui/material';

type ConnectionQuality = 'connecting' | 'poor' | 'fair' | 'good' | 'excellent' | 'disconnected';

interface ConnectionStatusProps {
  quality: ConnectionQuality;
  hideWhenGood?: boolean;
}

/**
 * Komponente zur Anzeige des Verbindungsstatus in einem Videoanruf
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ quality, hideWhenGood = false }) => {
  const theme = useTheme();

  // Wenn Verbindung gut ist und hideWhenGood aktiviert ist, nichts anzeigen
  if (hideWhenGood && (quality === 'good' || quality === 'excellent')) {
    return null;
  }

  // Konfiguration für verschiedene Verbindungsqualitäten
  const statusConfig: Record<
    ConnectionQuality,
    {
      label: string;
      color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
      icon: React.ReactNode;
    }
  > = {
    connecting: {
      label: 'Verbinde...',
      color: 'default',
      icon: <CircularProgress size={14} color="inherit" />,
    },
    disconnected: {
      label: 'Getrennt',
      color: 'error',
      icon: <NoInternetIcon />,
    },
    poor: {
      label: 'Schlechte Verbindung',
      color: 'error',
      icon: <SignalLowIcon />,
    },
    fair: {
      label: 'Mäßige Verbindung',
      color: 'warning',
      icon: <SignalMediumLowIcon />,
    },
    good: {
      label: 'Gute Verbindung',
      color: 'success',
      icon: <SignalMediumIcon />,
    },
    excellent: {
      label: 'Ausgezeichnete Verbindung',
      color: 'success',
      icon: <SignalHighIcon />,
    },
  };

  const config = statusConfig[quality];

  // Compute background color for default chip color
  const getDefaultBackgroundColor = (): string | undefined => {
    if (config.color !== 'default') return undefined;
    const rgbValues = theme.palette.mode === 'dark' ? '255, 255, 255, 0.1' : '0, 0, 0, 0.1';
    return `rgba(${rgbValues})`;
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
      }}
    >
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {config.icon}
          </Box>
        }
        sx={{
          fontWeight: 'medium',
          backdropFilter: 'blur(4px)',
          backgroundColor: getDefaultBackgroundColor(),
        }}
      />
    </Box>
  );
};

export default ConnectionStatus;
