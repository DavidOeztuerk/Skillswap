import React, { useState, useEffect, useCallback, useMemo, memo, type JSX } from 'react';
import { Button, Box, Typography, Tooltip, keyframes } from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';

interface JoinCallButtonProps {
  meetingUrl: string;
  canJoin: boolean;
  status: 'waiting' | 'ready' | 'active' | 'ended' | 'cancelled' | 'pending';
  startTime: Date;
  endTime: Date;
  onJoin: () => void;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

// Pulse animation for active meeting
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

// Countdown timer component
const CountdownTimer: React.FC<{ targetTime: Date }> = memo(({ targetTime }): JSX.Element => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = (): void => {
      const now = new Date();
      const totalSeconds = differenceInSeconds(targetTime, now);

      if (totalSeconds <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetTime]);

  return <span>{timeLeft}</span>;
});

CountdownTimer.displayName = 'CountdownTimer';

/**
 * Join Call Button Component
 * Smart button for joining video meetings with status indicators
 */
const JoinCallButton: React.FC<JoinCallButtonProps> = memo(
  ({ canJoin, status, startTime, onJoin, size = 'large', fullWidth = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
    }, []);
    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
    }, []);

    // Update current time every second when waiting
    useEffect(() => {
      if (status === 'waiting') {
        const timer = setInterval(() => {
          setCurrentTime(new Date());
        }, 1000);

        return () => {
          clearInterval(timer);
        };
      }
    }, [status]);

    // Get button configuration based on status
    const config = useMemo(() => {
      switch (status) {
        case 'active':
          return {
            color: 'success' as const,
            variant: 'contained' as const,
            icon: <VideoCallIcon />,
            label: 'Meeting beitreten',
            sublabel: 'Meeting läuft',
            disabled: false,
          };

        case 'ready':
          return {
            color: 'primary' as const,
            variant: 'contained' as const,
            icon: <VideoCallIcon />,
            label: 'Meeting beitreten',
            sublabel: 'Bereit zum Start',
            disabled: false,
          };

        case 'waiting': {
          const minutesLeft = differenceInMinutes(startTime, currentTime);
          return {
            color: 'inherit' as const,
            variant: 'outlined' as const,
            icon: <ScheduleIcon />,
            label: `Wartezeit: ${String(minutesLeft)} Min.`,
            sublabel: 'Noch nicht verfügbar',
            disabled: true,
          };
        }

        case 'ended':
          return {
            color: 'inherit' as const,
            variant: 'outlined' as const,
            icon: <BlockIcon />,
            label: 'Meeting beendet',
            sublabel: null,
            disabled: true,
          };

        case 'cancelled':
          return {
            color: 'error' as const,
            variant: 'outlined' as const,
            icon: <BlockIcon />,
            label: 'Termin abgesagt',
            sublabel: null,
            disabled: true,
          };

        case 'pending':
          return {
            color: 'warning' as const,
            variant: 'outlined' as const,
            icon: <ScheduleIcon />,
            label: 'Bestätigung ausstehend',
            sublabel: 'Termin nicht bestätigt',
            disabled: true,
          };

        default:
          return {
            color: 'inherit' as const,
            variant: 'outlined' as const,
            icon: <VideoCallIcon />,
            label: 'Meeting beitreten',
            sublabel: null,
            disabled: true,
          };
      }
    }, [status, startTime, currentTime]);

    // Show countdown timer for waiting state
    if (status === 'waiting') {
      return (
        <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
          <Button
            fullWidth={fullWidth}
            size={size}
            variant="outlined"
            color="inherit"
            disabled
            startIcon={<ScheduleIcon />}
            sx={{
              position: 'relative',
              textTransform: 'none',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="button">
                Beitritt in <CountdownTimer targetTime={startTime} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Meeting startet bald
              </Typography>
            </Box>
          </Button>
        </Box>
      );
    }

    // Active meeting with pulse animation
    if (status === 'active') {
      return (
        <Tooltip title="Meeting ist aktiv - jetzt beitreten!">
          <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
            <Button
              fullWidth={fullWidth}
              size={size}
              variant={config.variant}
              color={config.color}
              onClick={onJoin}
              disabled={config.disabled}
              startIcon={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {config.icon}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                      animation: `${pulse} 2s infinite`,
                    }}
                  />
                </Box>
              }
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              sx={{
                position: 'relative',
                textTransform: 'none',
                animation: `${pulse} 2s infinite`,
                '&:hover': {
                  animation: 'none',
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="button">
                  {isHovered ? 'Jetzt beitreten' : config.label}
                </Typography>
                {config.sublabel && (
                  <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                    {config.sublabel}
                  </Typography>
                )}
              </Box>
            </Button>
          </Box>
        </Tooltip>
      );
    }

    // Ready state with hover effect
    if (status === 'ready') {
      return (
        <Tooltip title="Meeting kann gestartet werden">
          <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
            <Button
              fullWidth={fullWidth}
              size={size}
              variant={config.variant}
              color={config.color}
              onClick={onJoin}
              disabled={config.disabled}
              startIcon={isHovered ? <PlayArrowIcon /> : config.icon}
              endIcon={canJoin ? <CheckCircleIcon fontSize="small" /> : null}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              sx={{
                position: 'relative',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="button">{config.label}</Typography>
                {config.sublabel && (
                  <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                    {config.sublabel}
                  </Typography>
                )}
              </Box>
            </Button>
          </Box>
        </Tooltip>
      );
    }

    // Default button for other states
    return (
      <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <Button
          fullWidth={fullWidth}
          size={size}
          variant={config.variant}
          color={config.color}
          onClick={onJoin}
          disabled={config.disabled || !canJoin}
          startIcon={config.icon}
          sx={{
            textTransform: 'none',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="button">{config.label}</Typography>
            {config.sublabel && (
              <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                {config.sublabel}
              </Typography>
            )}
          </Box>
        </Button>
      </Box>
    );
  }
);

JoinCallButton.displayName = 'JoinCallButton';

export default JoinCallButton;
