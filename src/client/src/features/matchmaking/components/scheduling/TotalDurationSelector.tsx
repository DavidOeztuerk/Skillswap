import React, { useCallback, useMemo } from 'react';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Chip,
  Stack,
  TextField,
  IconButton,
  Alert,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  QUICK_DURATION_OPTIONS,
  QUICK_DURATION_LABELS,
  MIN_TOTAL_DURATION_MINUTES,
  MAX_TOTAL_DURATION_MINUTES,
  SCHEDULING_LABELS,
} from '../../constants/scheduling';
import { formatDuration, parseDuration, toMinutes } from '../../utils/sessionCalculations';

// =============================================================================
// TYPES
// =============================================================================

interface TotalDurationSelectorProps {
  /** Current total duration in minutes */
  value: number;
  /** Callback when duration changes */
  onChange: (minutes: number) => void;
  /** Whether this is a skill exchange (shows split info) */
  isSkillExchange?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STEPPER_BUTTON_SX = { bgcolor: 'action.hover' } as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * TotalDurationSelector - Hybrid Number Input + Stepper for selecting total learning time.
 *
 * Features:
 * - Quick select chips for common durations (1h, 2h, 4h, 8h)
 * - Hybrid input: Hours + Minutes with stepper buttons
 * - Shows skill exchange split info when applicable
 * - Responsive design for mobile
 */
export const TotalDurationSelector: React.FC<TotalDurationSelectorProps> = ({
  value,
  onChange,
  isSkillExchange = false,
  disabled = false,
  error,
}) => {
  // Parse current value into hours and minutes
  const { hours, minutes } = useMemo(() => parseDuration(value), [value]);

  // Handle quick select chip click
  const handleQuickSelect = useCallback(
    (durationMinutes: number) => {
      if (!disabled) {
        onChange(durationMinutes);
      }
    },
    [disabled, onChange]
  );

  // Handle hours change
  const handleHoursChange = useCallback(
    (newHours: number) => {
      const clampedHours = Math.max(0, Math.min(20, newHours));
      const newTotal = toMinutes(clampedHours, minutes);
      const clampedTotal = Math.max(
        MIN_TOTAL_DURATION_MINUTES,
        Math.min(MAX_TOTAL_DURATION_MINUTES, newTotal)
      );
      onChange(clampedTotal);
    },
    [minutes, onChange]
  );

  // Handle minutes change
  const handleMinutesChange = useCallback(
    (newMinutes: number) => {
      // Clamp to 0-59 or allow increments that push to next hour
      let clampedMinutes = newMinutes;
      let adjustedHours = hours;

      if (newMinutes >= 60) {
        adjustedHours = hours + 1;
        clampedMinutes = 0;
      } else if (newMinutes < 0) {
        if (hours > 0) {
          adjustedHours = hours - 1;
          clampedMinutes = 45; // Go to 45 min when decrementing from 0
        } else {
          clampedMinutes = 0;
        }
      }

      const newTotal = toMinutes(adjustedHours, clampedMinutes);
      const clampedTotal = Math.max(
        MIN_TOTAL_DURATION_MINUTES,
        Math.min(MAX_TOTAL_DURATION_MINUTES, newTotal)
      );
      onChange(clampedTotal);
    },
    [hours, onChange]
  );

  // Handle direct input in text fields
  const handleHoursInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      if (inputValue === '') {
        handleHoursChange(0);
        return;
      }
      const parsed = Number.parseInt(inputValue, 10);
      if (!Number.isNaN(parsed)) {
        handleHoursChange(parsed);
      }
    },
    [handleHoursChange]
  );

  const handleMinutesInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      if (inputValue === '') {
        handleMinutesChange(0);
        return;
      }
      const parsed = Number.parseInt(inputValue, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < 60) {
        const newTotal = toMinutes(hours, parsed);
        const clampedTotal = Math.max(
          MIN_TOTAL_DURATION_MINUTES,
          Math.min(MAX_TOTAL_DURATION_MINUTES, newTotal)
        );
        onChange(clampedTotal);
      }
    },
    [hours, onChange, handleMinutesChange]
  );

  // Calculate skill exchange split for info display
  const exchangeSplitInfo = useMemo(() => {
    if (!isSkillExchange) return null;
    const halfMinutes = Math.ceil(value / 2);
    const otherHalf = value - halfMinutes;
    return {
      teachTime: formatDuration(halfMinutes),
      learnTime: formatDuration(otherHalf),
    };
  }, [isSkillExchange, value]);

  return (
    <Box>
      {/* Section Header */}
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {SCHEDULING_LABELS.TOTAL_DURATION}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {SCHEDULING_LABELS.TOTAL_DURATION_QUESTION}
      </Typography>

      {/* Quick Select Chips */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {SCHEDULING_LABELS.QUICK_SELECT}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {QUICK_DURATION_OPTIONS.map((duration) => (
          <Chip
            key={duration}
            label={QUICK_DURATION_LABELS[duration]}
            onClick={() => handleQuickSelect(duration)}
            color={value === duration ? 'primary' : 'default'}
            variant={value === duration ? 'filled' : 'outlined'}
            disabled={disabled}
            sx={{
              fontWeight: value === duration ? 600 : 400,
              transition: 'all 0.2s',
            }}
          />
        ))}
      </Stack>

      {/* Hybrid Input: Hours + Minutes with Steppers */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {SCHEDULING_LABELS.EXACT_INPUT}
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
        }}
      >
        {/* Hours Input with Steppers */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => handleHoursChange(hours - 1)}
            disabled={disabled || value <= MIN_TOTAL_DURATION_MINUTES}
            sx={STEPPER_BUTTON_SX}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <TextField
            value={hours}
            onChange={handleHoursInput}
            disabled={disabled}
            size="small"
            type="number"
            slotProps={{
              htmlInput: {
                min: 0,
                max: 20,
                style: { textAlign: 'center', width: 50 },
                inputMode: 'numeric',
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">
                      {SCHEDULING_LABELS.HOURS}
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& input': {
                  MozAppearance: 'textfield',
                  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                },
              },
            }}
          />
          <IconButton
            size="small"
            onClick={() => handleHoursChange(hours + 1)}
            disabled={disabled || value >= MAX_TOTAL_DURATION_MINUTES}
            sx={STEPPER_BUTTON_SX}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Minutes Input with Steppers */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => handleMinutesChange(minutes - 15)}
            disabled={disabled || (hours === 0 && minutes <= 30)}
            sx={STEPPER_BUTTON_SX}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <TextField
            value={minutes}
            onChange={handleMinutesInput}
            disabled={disabled}
            size="small"
            type="number"
            slotProps={{
              htmlInput: {
                min: 0,
                max: 59,
                style: { textAlign: 'center', width: 50 },
                inputMode: 'numeric',
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">
                      {SCHEDULING_LABELS.MINUTES}
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& input': {
                  MozAppearance: 'textfield',
                  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                },
              },
            }}
          />
          <IconButton
            size="small"
            onClick={() => handleMinutesChange(minutes + 15)}
            disabled={disabled || value >= MAX_TOTAL_DURATION_MINUTES}
            sx={STEPPER_BUTTON_SX}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Current Value Display */}
        <Typography
          variant="h6"
          color="primary"
          sx={{
            minWidth: 100,
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          = {formatDuration(value)}
        </Typography>
      </Paper>

      {/* Skill Exchange Split Info */}
      {isSkillExchange && exchangeSplitInfo ? (
        <Alert severity="info" sx={{ mt: 2 }} icon={false}>
          <Typography variant="body2">
            Bei Skill-Tausch: <strong>{exchangeSplitInfo.teachTime}</strong> Lehren +{' '}
            <strong>{exchangeSplitInfo.learnTime}</strong> Lernen
          </Typography>
        </Alert>
      ) : null}

      {/* Error Display */}
      {error ? (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
};

export default TotalDurationSelector;
