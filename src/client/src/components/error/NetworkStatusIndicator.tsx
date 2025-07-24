import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Chip,
  Typography,
  Collapse,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  SignalWifi1Bar as SlowIcon,
  Wifi as OnlineIcon,
} from '@mui/icons-material';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface NetworkStatusIndicatorProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom' | 'inline';
  compact?: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showWhenOnline = false,
  position = 'top',
  compact = false,
}) => {
  const { isOnline, isSlowConnection, connectionType, downlink, rtt } = useNetworkStatus();

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        severity: 'error' as const,
        icon: <OfflineIcon />,
        title: 'Offline',
        message: 'Keine Internetverbindung',
        color: 'error',
      };
    }

    if (isSlowConnection) {
      return {
        severity: 'warning' as const,
        icon: <SlowIcon />,
        title: 'Langsame Verbindung',
        message: 'Die Verbindung ist langsam. Vorgänge können länger dauern.',
        color: 'warning',
      };
    }

    return {
      severity: 'success' as const,
      icon: <OnlineIcon />,
      title: 'Online',
      message: 'Verbindung ist stabil',
      color: 'success',
    };
  };

  const statusInfo = getStatusInfo();
  const shouldShow = !isOnline || isSlowConnection || showWhenOnline;

  if (!shouldShow) return null;

  const getConnectionTypeLabel = () => {
    switch (connectionType) {
      case '2g': return '2G';
      case '3g': return '3G';
      case '4g': return '4G';
      case 'wifi': return 'WiFi';
      case 'ethernet': return 'Ethernet';
      default: return 'Unbekannt';
    }
  };

  const positionStyles = {
    top: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1300,
    },
    bottom: {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1300,
    },
    inline: {},
  };

  if (compact) {
    return (
      <Box sx={positionStyles[position]}>
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.title}
          color={statusInfo.color as any}
          size="small"
          variant={!isOnline ? 'filled' : 'outlined'}
        />
      </Box>
    );
  }

  return (
    <Box sx={positionStyles[position]}>
      <Collapse in={shouldShow}>
        <Alert 
          severity={statusInfo.severity}
          icon={statusInfo.icon}
          variant={!isOnline ? 'filled' : 'outlined'}
        >
          <AlertTitle>{statusInfo.title}</AlertTitle>
          <Typography variant="body2">
            {statusInfo.message}
          </Typography>
          
          {(downlink || rtt || connectionType !== 'unknown') && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {connectionType !== 'unknown' && (
                <Chip 
                  label={`${getConnectionTypeLabel()}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {downlink && (
                <Chip 
                  label={`${downlink.toFixed(1)} Mbps`}
                  size="small"
                  variant="outlined"
                />
              )}
              {rtt && (
                <Chip 
                  label={`${rtt}ms`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Alert>
      </Collapse>
    </Box>
  );
};

export default NetworkStatusIndicator;