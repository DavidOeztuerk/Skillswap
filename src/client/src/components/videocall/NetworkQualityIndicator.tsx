import React, { type JSX } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';
import SignalCellular3BarIcon from '@mui/icons-material/SignalCellular3Bar';
import SignalCellular2BarIcon from '@mui/icons-material/SignalCellular2Bar';
import SignalCellular1BarIcon from '@mui/icons-material/SignalCellular1Bar';
import type { NetworkQualityStats } from '../../hooks/useNetworkQuality';

interface NetworkQualityIndicatorProps {
  stats: NetworkQualityStats;
  showDetails?: boolean;
}

/**
 * Network Quality Indicator Component
 * Displays real-time network quality with visual feedback using signal strength icons
 * @param stats - Network quality statistics to display
 * @param showDetails - Whether to show detailed stats in tooltip
 */
export const NetworkQualityIndicator: React.FC<NetworkQualityIndicatorProps> = ({
  stats,
  showDetails = false,
}) => {
  const getQualityIcon = (): JSX.Element => {
    switch (stats.quality) {
      case 'excellent':
        return <SignalCellular4BarIcon sx={{ color: '#4caf50' }} />;
      case 'good':
        return <SignalCellular3BarIcon sx={{ color: '#8bc34a' }} />;
      case 'fair':
        return <SignalCellular2BarIcon sx={{ color: '#ff9800' }} />;
      case 'poor':
        return <SignalCellular1BarIcon sx={{ color: '#f44336' }} />;
      default:
        return <SignalCellularAltIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getQualityColor = (): string => {
    switch (stats.quality) {
      case 'excellent':
        return '#4caf50';
      case 'good':
        return '#8bc34a';
      case 'fair':
        return '#ff9800';
      case 'poor':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getQualityText = (): string => {
    switch (stats.quality) {
      case 'excellent':
        return 'Ausgezeichnet';
      case 'good':
        return 'Gut';
      case 'fair':
        return 'Akzeptabel';
      case 'poor':
        return 'Schlecht';
      default:
        return 'Unbekannt';
    }
  };

  const tooltipContent = (
    <Box>
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        Netzwerkqualität: {getQualityText()}
      </Typography>
      <Typography variant="caption" display="block" fontWeight="bold">
        Video:
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Paketverlust: {stats.videoPacketsLostPerSecond}/s
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Jitter: {stats.videoJitter}ms
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Bandbreite: {stats.videoBandwidth}kbps
      </Typography>

      <Typography variant="caption" display="block" fontWeight="bold" sx={{ mt: 0.5 }}>
        Audio:
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Paketverlust: {stats.audioPacketsLostPerSecond}/s
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Jitter: {stats.audioJitter}ms
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Bandbreite: {stats.audioBandwidth}kbps
      </Typography>

      <Typography variant="caption" display="block" fontWeight="bold" sx={{ mt: 0.5 }}>
        Gesamt:
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Round-Trip-Time: {stats.roundTripTime}ms
      </Typography>
      <Typography variant="caption" display="block" sx={{ ml: 1 }}>
        Gesamt-Bandbreite: {stats.totalBandwidth}kbps
      </Typography>

      <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
        Aktualisiert: {stats.lastUpdate.toLocaleTimeString()}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: showDetails ? 1 : 0.5,
          borderRadius: 1,
          backgroundColor: showDetails ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
          cursor: 'pointer',
        }}
      >
        {getQualityIcon()}
        {showDetails && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: getQualityColor(),
                fontWeight: 'bold',
                display: 'block',
              }}
            >
              {getQualityText()}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
              {stats.totalBandwidth}kbps • {stats.roundTripTime}ms
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default NetworkQualityIndicator;
