import React, { type JSX } from 'react';
import SignalCellular1BarIcon from '@mui/icons-material/SignalCellular1Bar';
import SignalCellular2BarIcon from '@mui/icons-material/SignalCellular2Bar';
import SignalCellular3BarIcon from '@mui/icons-material/SignalCellular3Bar';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import { Box, Tooltip, Typography } from '@mui/material';
import { featureColors } from '../../../styles/tokens/colors';
import type { NetworkQuality, NetworkQualityStats } from '../hooks/useNetworkQuality';

// Quality color mapping using design tokens
const qualityColors: Record<NetworkQuality, string> = {
  excellent: featureColors.networkQuality.excellent,
  good: featureColors.networkQuality.good,
  fair: featureColors.networkQuality.fair,
  poor: featureColors.networkQuality.poor,
  unknown: featureColors.networkQuality.unknown,
};

// Quality text labels (German)
const qualityLabels: Record<NetworkQuality, string> = {
  excellent: 'Ausgezeichnet',
  good: 'Gut',
  fair: 'Akzeptabel',
  poor: 'Schlecht',
  unknown: 'Unbekannt',
};

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
  const color = qualityColors[stats.quality];
  const label = qualityLabels[stats.quality];

  const getQualityIcon = (): JSX.Element => {
    const iconProps = { sx: { color } };
    switch (stats.quality) {
      case 'excellent':
        return <SignalCellular4BarIcon {...iconProps} />;
      case 'good':
        return <SignalCellular3BarIcon {...iconProps} />;
      case 'fair':
        return <SignalCellular2BarIcon {...iconProps} />;
      case 'poor':
        return <SignalCellular1BarIcon {...iconProps} />;
      case 'unknown':
        return <SignalCellularAltIcon {...iconProps} />;
      default: {
        const _exhaustiveCheck: never = stats.quality;
        return _exhaustiveCheck;
      }
    }
  };

  const tooltipContent = (
    <Box>
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        Netzwerkqualität: {label}
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
        {showDetails ? (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color,
                fontWeight: 'bold',
                display: 'block',
              }}
            >
              {label}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
              {stats.totalBandwidth}kbps • {stats.roundTripTime}ms
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Tooltip>
  );
};

export default NetworkQualityIndicator;
