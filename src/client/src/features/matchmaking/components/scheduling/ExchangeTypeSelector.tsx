import React, { useCallback, useMemo } from 'react';
import { SwapHoriz as SwapIcon, Euro as EuroIcon, Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Alert,
  Stack,
  Button,
  Paper,
  FormHelperText,
} from '@mui/material';
import {
  EXCHANGE_TYPES,
  EXCHANGE_TYPE_CONFIG,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY,
  DEFAULT_HOURLY_RATE,
  MIN_HOURLY_RATE,
  MAX_HOURLY_RATE,
  SCHEDULING_LABELS,
  type ExchangeType,
  type Currency,
} from '../../constants/scheduling';
import { calculatePayment, formatDuration } from '../../utils/sessionCalculations';
import type { GetUserSkillResponse } from '../../../skills/types/SkillResponses';

// =============================================================================
// TYPES
// =============================================================================

interface ExchangeTypeSelectorProps {
  /** Current exchange type */
  value: ExchangeType;
  /** Callback when exchange type changes */
  onChange: (type: ExchangeType) => void;
  /** For skill exchange: currently selected skill ID */
  exchangeSkillId?: string;
  /** Callback when exchange skill changes */
  onExchangeSkillChange?: (skillId: string, skillName: string) => void;
  /** Available user skills for exchange */
  userSkills?: GetUserSkillResponse[];
  /** Callback to open quick skill create dialog */
  onCreateSkill?: () => void;
  /** For payment: hourly rate */
  hourlyRate?: number;
  /** Callback when hourly rate changes */
  onHourlyRateChange?: (rate: number) => void;
  /** For payment: currency */
  currency?: Currency;
  /** Callback when currency changes */
  onCurrencyChange?: (currency: Currency) => void;
  /** Total duration for payment estimate */
  totalDurationMinutes?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Error messages */
  errors?: {
    exchangeType?: string;
    exchangeSkillId?: string;
    hourlyRate?: string;
  };
}

// =============================================================================
// ICON MAPPING
// =============================================================================

const EXCHANGE_TYPE_ICONS: Record<ExchangeType, React.ReactNode> = {
  [EXCHANGE_TYPES.SKILL_EXCHANGE]: <SwapIcon />,
  [EXCHANGE_TYPES.PAYMENT]: <EuroIcon />,
};

// Default values as constants to avoid re-creation on each render
const DEFAULT_USER_SKILLS: ExchangeTypeSelectorProps['userSkills'] = [];
const DEFAULT_ERRORS: ExchangeTypeSelectorProps['errors'] = {};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ExchangeTypeSelector - Three-way selector for exchange type
 *
 * Options:
 * - Skill Exchange: Trade skills with another user
 * - Payment: Pay for learning sessions
 * - Free: Voluntary knowledge exchange
 *
 * Shows conditional fields based on selection:
 * - Skill Exchange: Skill dropdown + Create New button
 * - Payment: Hourly rate input + currency selector
 * - Free: Just informational text
 */
export const ExchangeTypeSelector: React.FC<ExchangeTypeSelectorProps> = ({
  value,
  onChange,
  exchangeSkillId,
  onExchangeSkillChange,
  userSkills = DEFAULT_USER_SKILLS,
  onCreateSkill,
  hourlyRate = DEFAULT_HOURLY_RATE,
  onHourlyRateChange,
  currency = DEFAULT_CURRENCY,
  onCurrencyChange,
  totalDurationMinutes = 120,
  disabled = false,
  errors = DEFAULT_ERRORS,
}) => {
  // Handle exchange type change
  const handleTypeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newType: ExchangeType | null) => {
      if (newType !== null && !disabled) {
        onChange(newType);
      }
    },
    [disabled, onChange]
  );

  // Handle skill selection
  const handleSkillSelect = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      const skillId = event.target.value as string;
      const skill = userSkills.find((s) => s.skillId === skillId);
      if (skill && onExchangeSkillChange) {
        onExchangeSkillChange(skillId, skill.name);
      }
    },
    [userSkills, onExchangeSkillChange]
  );

  // Handle hourly rate change
  const handleRateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      if (inputValue === '') {
        onHourlyRateChange?.(0);
        return;
      }
      const parsed = Number.parseFloat(inputValue);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        onHourlyRateChange?.(Math.min(MAX_HOURLY_RATE, parsed));
      }
    },
    [onHourlyRateChange]
  );

  // Handle currency change
  const handleCurrencyChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      onCurrencyChange?.(event.target.value as Currency);
    },
    [onCurrencyChange]
  );

  // Calculate payment estimate
  const paymentEstimate = useMemo(() => {
    if (value !== EXCHANGE_TYPES.PAYMENT || !hourlyRate) return null;
    return calculatePayment(hourlyRate, totalDurationMinutes, currency);
  }, [value, hourlyRate, totalDurationMinutes, currency]);

  // Filter user skills (only offered skills can be exchanged)
  const exchangeableSkills = useMemo(
    () => userSkills.filter((skill) => skill.isOffered),
    [userSkills]
  );

  return (
    <Box>
      {/* Section Header */}
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {SCHEDULING_LABELS.EXCHANGE_TYPE}
      </Typography>

      {/* Exchange Type Toggle Buttons */}
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleTypeChange}
        disabled={disabled}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
          '& .MuiToggleButton-root': {
            flex: { xs: '1 1 100%', sm: '1 1 auto' },
            py: 1.5,
            px: 2,
            borderRadius: '8px !important',
            border: '1px solid',
            borderColor: 'divider',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderColor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        {Object.values(EXCHANGE_TYPES).map((type) => (
          <ToggleButton key={type} value={type}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {EXCHANGE_TYPE_ICONS[type]}
              <Typography variant="body2" fontWeight={value === type ? 600 : 400}>
                {EXCHANGE_TYPE_CONFIG[type].label}
              </Typography>
            </Stack>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Description */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {EXCHANGE_TYPE_CONFIG[value].description}
      </Typography>

      {/* Conditional Fields based on Exchange Type */}
      {value === EXCHANGE_TYPES.SKILL_EXCHANGE && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
            {SCHEDULING_LABELS.YOUR_EXCHANGE_SKILL}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <FormControl
              fullWidth
              size="small"
              error={!!errors.exchangeSkillId}
              disabled={disabled}
            >
              <InputLabel id="exchange-skill-label">Skill auswählen</InputLabel>
              <Select
                labelId="exchange-skill-label"
                value={exchangeSkillId ?? ''}
                onChange={handleSkillSelect as never}
                label="Skill auswählen"
              >
                {exchangeableSkills.length === 0 ? (
                  <MenuItem disabled>Keine Skills verfügbar</MenuItem>
                ) : (
                  exchangeableSkills.map((skill) => (
                    <MenuItem key={skill.skillId} value={skill.skillId}>
                      <Stack>
                        <Typography variant="body2">{skill.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {skill.category.name}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.exchangeSkillId ? (
                <FormHelperText>{errors.exchangeSkillId}</FormHelperText>
              ) : null}
            </FormControl>

            {onCreateSkill ? (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onCreateSkill}
                disabled={disabled}
                sx={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}
              >
                {SCHEDULING_LABELS.CREATE_NEW_SKILL}
              </Button>
            ) : null}
          </Stack>

          {exchangeableSkills.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {SCHEDULING_LABELS.INFO_EXCHANGE_REQUIRES_SKILL}
            </Alert>
          )}
        </Paper>
      )}

      {value === EXCHANGE_TYPES.PAYMENT && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
            {SCHEDULING_LABELS.HOURLY_RATE}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              type="number"
              value={hourlyRate || ''}
              onChange={handleRateChange}
              disabled={disabled}
              size="small"
              error={!!errors.hourlyRate}
              helperText={errors.hourlyRate}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">{CURRENCY_SYMBOLS[currency]}</InputAdornment>
                  ),
                },
                htmlInput: {
                  min: MIN_HOURLY_RATE,
                  max: MAX_HOURLY_RATE,
                  step: 5,
                },
              }}
              sx={{ width: { xs: '100%', sm: 150 } }}
            />

            <FormControl size="small" sx={{ minWidth: 100 }} disabled={disabled}>
              <Select value={currency} onChange={handleCurrencyChange as never}>
                {CURRENCIES.map((curr) => (
                  <MenuItem key={curr} value={curr}>
                    {curr}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {paymentEstimate ? (
            <Alert severity="info" icon={false} sx={{ mt: 2 }}>
              <Typography variant="body2">
                Geschätzter Gesamtpreis: <strong>{paymentEstimate.formattedAmount}</strong> (
                {formatDuration(totalDurationMinutes)})
              </Typography>
            </Alert>
          ) : null}
        </Paper>
      )}
    </Box>
  );
};

export default ExchangeTypeSelector;
