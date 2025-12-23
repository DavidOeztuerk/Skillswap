import React, { useState, useEffect, useCallback, useMemo, memo, type JSX } from 'react';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import {
  VideoCall as VideoCallIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { Button, Box, Typography, Tooltip, keyframes } from '@mui/material';

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

interface ButtonConfig {
  color: 'success' | 'primary' | 'inherit' | 'error' | 'warning';
  variant: 'contained' | 'outlined';
  icon: JSX.Element;
  label: string;
  sublabel: string | null;
  disabled: boolean;
}

// Pulse animation for active meeting
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
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

/** Get button configuration based on status */
function getButtonConfig(
  status: JoinCallButtonProps['status'],
  startTime: Date,
  currentTime: Date
): ButtonConfig {
  switch (status) {
    case 'active':
      return {
        color: 'success',
        variant: 'contained',
        icon: <VideoCallIcon />,
        label: 'Meeting beitreten',
        sublabel: 'Meeting läuft',
        disabled: false,
      };

    case 'ready':
      return {
        color: 'primary',
        variant: 'contained',
        icon: <VideoCallIcon />,
        label: 'Meeting beitreten',
        sublabel: 'Bereit zum Start',
        disabled: false,
      };

    case 'waiting': {
      const minutesLeft = differenceInMinutes(startTime, currentTime);
      return {
        color: 'inherit',
        variant: 'outlined',
        icon: <ScheduleIcon />,
        label: `Wartezeit: ${minutesLeft} Min.`,
        sublabel: 'Noch nicht verfügbar',
        disabled: true,
      };
    }

    case 'ended':
      return {
        color: 'inherit',
        variant: 'outlined',
        icon: <BlockIcon />,
        label: 'Meeting beendet',
        sublabel: null,
        disabled: true,
      };

    case 'cancelled':
      return {
        color: 'error',
        variant: 'outlined',
        icon: <BlockIcon />,
        label: 'Termin abgesagt',
        sublabel: null,
        disabled: true,
      };

    case 'pending':
      return {
        color: 'warning',
        variant: 'outlined',
        icon: <ScheduleIcon />,
        label: 'Bestätigung ausstehend',
        sublabel: 'Termin nicht bestätigt',
        disabled: true,
      };

    default: {
      // Exhaustive check - this should never be reached
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

/** Button content with label and sublabel */
const ButtonContent: React.FC<{ label: string; sublabel: string | null }> = memo(
  ({ label, sublabel }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="button">{label}</Typography>
      {sublabel !== null && (
        <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
          {sublabel}
        </Typography>
      )}
    </Box>
  )
);

ButtonContent.displayName = 'ButtonContent';

/** Waiting state button with countdown */
const WaitingButton: React.FC<{
  startTime: Date;
  size: 'small' | 'medium' | 'large';
  fullWidth: boolean;
}> = memo(({ startTime, size, fullWidth }) => (
  <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
    <Button
      fullWidth={fullWidth}
      size={size}
      variant="outlined"
      color="inherit"
      disabled
      startIcon={<ScheduleIcon />}
      sx={{ position: 'relative', textTransform: 'none' }}
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
));

WaitingButton.displayName = 'WaitingButton';

/** Active meeting button with pulse animation */
const ActiveButton: React.FC<{
  config: ButtonConfig;
  size: 'small' | 'medium' | 'large';
  fullWidth: boolean;
  onJoin: () => void;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = memo(({ config, size, fullWidth, onJoin, isHovered, onMouseEnter, onMouseLeave }) => (
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={{
          position: 'relative',
          textTransform: 'none',
          animation: `${pulse} 2s infinite`,
          '&:hover': { animation: 'none' },
        }}
      >
        <ButtonContent
          label={isHovered ? 'Jetzt beitreten' : config.label}
          sublabel={config.sublabel}
        />
      </Button>
    </Box>
  </Tooltip>
));

ActiveButton.displayName = 'ActiveButton';

/** Ready state button with hover effect */
const ReadyButton: React.FC<{
  config: ButtonConfig;
  size: 'small' | 'medium' | 'large';
  fullWidth: boolean;
  canJoin: boolean;
  onJoin: () => void;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = memo(({ config, size, fullWidth, canJoin, onJoin, isHovered, onMouseEnter, onMouseLeave }) => (
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={{
          position: 'relative',
          textTransform: 'none',
          transition: 'all 0.3s ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
        }}
      >
        <ButtonContent label={config.label} sublabel={config.sublabel} />
      </Button>
    </Box>
  </Tooltip>
));

ReadyButton.displayName = 'ReadyButton';

/** Default button for other states */
const DefaultButton: React.FC<{
  config: ButtonConfig;
  size: 'small' | 'medium' | 'large';
  fullWidth: boolean;
  canJoin: boolean;
  onJoin: () => void;
}> = memo(({ config, size, fullWidth, canJoin, onJoin }) => (
  <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
    <Button
      fullWidth={fullWidth}
      size={size}
      variant={config.variant}
      color={config.color}
      onClick={onJoin}
      disabled={config.disabled || !canJoin}
      startIcon={config.icon}
      sx={{ textTransform: 'none' }}
    >
      <ButtonContent label={config.label} sublabel={config.sublabel} />
    </Button>
  </Box>
));

DefaultButton.displayName = 'DefaultButton';

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
      if (status !== 'waiting') {
        return;
      }

      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }, [status]);

    const config = useMemo(
      () => getButtonConfig(status, startTime, currentTime),
      [status, startTime, currentTime]
    );

    if (status === 'waiting') {
      return <WaitingButton startTime={startTime} size={size} fullWidth={fullWidth} />;
    }

    if (status === 'active') {
      return (
        <ActiveButton
          config={config}
          size={size}
          fullWidth={fullWidth}
          onJoin={onJoin}
          isHovered={isHovered}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );
    }

    if (status === 'ready') {
      return (
        <ReadyButton
          config={config}
          size={size}
          fullWidth={fullWidth}
          canJoin={canJoin}
          onJoin={onJoin}
          isHovered={isHovered}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );
    }

    return (
      <DefaultButton
        config={config}
        size={size}
        fullWidth={fullWidth}
        canJoin={canJoin}
        onJoin={onJoin}
      />
    );
  }
);

JoinCallButton.displayName = 'JoinCallButton';

export default JoinCallButton;
