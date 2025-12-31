import React, { useCallback, useMemo } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { School as SchoolIcon, Person as PersonIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Divider,
  Grid,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormHelperText,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Alert,
} from '@mui/material';
import { WEEKDAYS, getWeekdayLabel, TIME_SLOTS } from '../../../../core/config/constants';
import {
  SESSION_DURATION_OPTIONS,
  SESSION_DURATION_LABELS,
  DEFAULT_TOTAL_DURATION_MINUTES,
  DEFAULT_SESSION_DURATION_MINUTES,
  EXCHANGE_TYPES,
  TIME_RANGES,
  SCHEDULING_LABELS,
  WEEKDAY_SHORT_LABELS,
  type ExchangeType,
} from '../../constants/scheduling';
import { calculateSessions } from '../../utils/sessionCalculations';
import CalendarIntegrationHint from '../CalendarIntegrationHint';
import ExchangeTypeSelector from './ExchangeTypeSelector';
import SessionCalculationDisplay from './SessionCalculationDisplay';
import TotalDurationSelector from './TotalDurationSelector';
import type { GetUserSkillResponse } from '../../../skills/types/SkillResponses';

// =============================================================================
// TYPES
// =============================================================================

interface SessionPlanningFormValues {
  totalDurationMinutes: number;
  sessionDurationMinutes: number;
  exchangeType: ExchangeType;
  exchangeSkillId?: string;
  exchangeSkillName?: string;
  hourlyRate?: number;
  currency?: string;
  preferredDays: string[];
  preferredTimes: string[];
  isOffering: boolean;
}

interface SessionPlanningSectionProps {
  /** React Hook Form control */
  control: Control<SessionPlanningFormValues>;
  /** Form field errors */
  errors: FieldErrors<SessionPlanningFormValues>;
  /** Watch function for reactive values */
  watch: (name: keyof SessionPlanningFormValues) => unknown;
  /** setValue function for updating form values */
  setValue: (name: keyof SessionPlanningFormValues, value: unknown) => void;
  /** User's available skills for exchange */
  userSkills?: GetUserSkillResponse[];
  /** Callback to open QuickSkillCreate dialog */
  onCreateSkill?: () => void;
  /** Target user name for display */
  targetUserName?: string;
  /** Skill name being requested */
  skillName?: string;
  /** Loading state */
  isLoading?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Default values as constants to avoid re-creation on each render
const DEFAULT_USER_SKILLS: SessionPlanningSectionProps['userSkills'] = [];

const MENU_ITEM_HEIGHT = 48;
const MENU_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: MENU_ITEM_HEIGHT * 4.5 + MENU_PADDING_TOP,
      width: 250,
    },
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SessionPlanningSection - Comprehensive session planning component
 *
 * Includes:
 * - Offer/Seek toggle (learn or teach)
 * - Total duration selector with hybrid input
 * - Session duration dropdown
 * - Session calculation display
 * - Exchange type selector (skill exchange, payment, free)
 * - Preferred days and times multi-selects
 */
export const SessionPlanningSection: React.FC<SessionPlanningSectionProps> = ({
  control,
  errors,
  watch,
  setValue,
  userSkills = DEFAULT_USER_SKILLS,
  onCreateSkill,
  targetUserName,
  skillName,
  isLoading = false,
}) => {
  // Watch form values for reactive display
  const totalDurationMinutes =
    (watch('totalDurationMinutes') as number) || DEFAULT_TOTAL_DURATION_MINUTES;
  const sessionDurationMinutes =
    (watch('sessionDurationMinutes') as number) || DEFAULT_SESSION_DURATION_MINUTES;
  const exchangeType = (watch('exchangeType') as ExchangeType | undefined) ?? EXCHANGE_TYPES.FREE;
  const isOffering = (watch('isOffering') as boolean) || false;
  const exchangeSkillId = watch('exchangeSkillId') as string | undefined;
  const hourlyRate = watch('hourlyRate') as number | undefined;
  const currency = watch('currency') as string | undefined;

  // Check if this is a skill exchange
  const isSkillExchange = exchangeType === EXCHANGE_TYPES.SKILL_EXCHANGE;

  // Calculate sessions for display
  const calculation = useMemo(
    () => calculateSessions(totalDurationMinutes, sessionDurationMinutes, isSkillExchange),
    [totalDurationMinutes, sessionDurationMinutes, isSkillExchange]
  );

  // Handle exchange skill selection
  const handleExchangeSkillChange = useCallback(
    (skillId: string, selectedSkillName: string) => {
      setValue('exchangeSkillId', skillId);
      setValue('exchangeSkillName', selectedSkillName);
    },
    [setValue]
  );

  // Handle hourly rate change
  const handleHourlyRateChange = useCallback(
    (rate: number) => {
      setValue('hourlyRate', rate);
    },
    [setValue]
  );

  // Handle currency change
  const handleCurrencyChange = useCallback(
    (curr: string) => {
      setValue('currency', curr);
    },
    [setValue]
  );

  return (
    <Box>
      {/* Section 1: Offer or Seek */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {SCHEDULING_LABELS.OFFER_TYPE}
        </Typography>
        <Controller
          name="isOffering"
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup
              value={field.value ? 'teach' : 'learn'}
              exclusive
              onChange={(_e, newValue) => {
                if (newValue !== null) {
                  field.onChange(newValue === 'teach');
                }
              }}
              disabled={isLoading}
              sx={{
                width: '100%',
                '& .MuiToggleButton-root': {
                  flex: 1,
                  py: 1.5,
                },
              }}
            >
              <ToggleButton value="learn">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SchoolIcon />
                  <Typography variant="body2" fontWeight={field.value ? 400 : 600}>
                    {SCHEDULING_LABELS.WANT_TO_LEARN}
                  </Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="teach">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon />
                  <Typography variant="body2" fontWeight={field.value ? 600 : 400}>
                    {SCHEDULING_LABELS.WANT_TO_TEACH}
                  </Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        />
        {targetUserName && skillName ? (
          <Alert severity="info" sx={{ mt: 1 }} icon={false}>
            <Typography variant="body2">
              {isOffering
                ? `Du wirst ${skillName} an ${targetUserName} lehren.`
                : `Du wirst ${skillName} von ${targetUserName} lernen.`}
            </Typography>
          </Alert>
        ) : null}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Section 2: Exchange Type */}
      <Box sx={{ mb: 3 }}>
        <Controller
          name="exchangeType"
          control={control}
          render={({ field }) => (
            <ExchangeTypeSelector
              value={field.value}
              onChange={field.onChange}
              exchangeSkillId={exchangeSkillId}
              onExchangeSkillChange={handleExchangeSkillChange}
              userSkills={userSkills}
              onCreateSkill={onCreateSkill}
              hourlyRate={hourlyRate}
              onHourlyRateChange={handleHourlyRateChange}
              currency={currency as never}
              onCurrencyChange={handleCurrencyChange}
              totalDurationMinutes={totalDurationMinutes}
              disabled={isLoading}
              errors={{
                exchangeSkillId: errors.exchangeSkillId?.message,
                hourlyRate: errors.hourlyRate?.message,
              }}
            />
          )}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Section 3: Duration Planning */}
      <Grid container spacing={3}>
        {/* Total Duration */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Controller
            name="totalDurationMinutes"
            control={control}
            render={({ field }) => (
              <TotalDurationSelector
                value={field.value}
                onChange={field.onChange}
                isSkillExchange={isSkillExchange}
                disabled={isLoading}
                error={errors.totalDurationMinutes?.message}
              />
            )}
          />
        </Grid>

        {/* Session Calculation Display */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <SessionCalculationDisplay
            totalDurationMinutes={totalDurationMinutes}
            sessionDurationMinutes={sessionDurationMinutes}
            isSkillExchange={isSkillExchange}
          />
        </Grid>

        {/* Session Duration Dropdown */}
        <Grid sx={{ xs: 12 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {SCHEDULING_LABELS.SESSION_DURATION}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {SCHEDULING_LABELS.SESSION_DURATION_QUESTION}
          </Typography>
          <Controller
            name="sessionDurationMinutes"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                value={field.value}
                exclusive
                onChange={(_e, newValue) => {
                  if (newValue !== null) {
                    field.onChange(newValue);
                  }
                }}
                disabled={isLoading}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 1,
                    borderRadius: '8px !important',
                    border: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                {SESSION_DURATION_OPTIONS.map((duration) => (
                  <ToggleButton
                    key={duration}
                    value={duration}
                    disabled={duration > totalDurationMinutes * 2}
                  >
                    {SESSION_DURATION_LABELS[duration]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {SCHEDULING_LABELS.SESSION_TIP}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Section 4: Preferred Schedule */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {SCHEDULING_LABELS.PREFERRED_SCHEDULE}
        </Typography>
        <CalendarIntegrationHint defaultExpanded={false} compact />
      </Box>

      <Grid container spacing={2}>
        {/* Preferred Days */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Controller
            name="preferredDays"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.preferredDays}>
                <FormLabel component="legend">{SCHEDULING_LABELS.WEEKDAYS_LABEL}</FormLabel>
                <Select
                  multiple
                  value={field.value}
                  onChange={(event) => {
                    const selected = event.target.value as string[];
                    const sorted = [...selected].sort(
                      (a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)
                    );
                    field.onChange(sorted);
                  }}
                  input={<OutlinedInput id="select-days" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={WEEKDAY_SHORT_LABELS[value] || getWeekdayLabel(value)}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                  disabled={isLoading}
                >
                  {WEEKDAYS.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox checked={field.value.includes(day)} />
                      <ListItemText primary={getWeekdayLabel(day)} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.preferredDays ? (
                  <FormHelperText>{errors.preferredDays.message}</FormHelperText>
                ) : null}
              </FormControl>
            )}
          />
        </Grid>

        {/* Preferred Times */}
        <Grid sx={{ xs: 12, md: 6 }}>
          <Controller
            name="preferredTimes"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.preferredTimes}>
                <FormLabel component="legend">{SCHEDULING_LABELS.TIME_OF_DAY}</FormLabel>

                {/* Quick Time Range Chips */}
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  {Object.values(TIME_RANGES).map((range) => {
                    const fieldValues = field.value;
                    const rangeTimes = range.times as unknown as string[];
                    const isSelected = rangeTimes.every((t) => fieldValues.includes(t));
                    return (
                      <Chip
                        key={range.id}
                        label={range.label}
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : 'default'}
                        onClick={() => {
                          if (isSelected) {
                            // Remove all times from this range
                            const newValue = fieldValues.filter((t) => !rangeTimes.includes(t));
                            field.onChange(newValue);
                          } else {
                            // Add all times from this range
                            const combined = [...new Set([...fieldValues, ...rangeTimes])];
                            const sorted = combined.sort(
                              (a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b)
                            );
                            field.onChange(sorted);
                          }
                        }}
                        disabled={isLoading}
                        size="small"
                      />
                    );
                  })}
                </Stack>

                <Select
                  multiple
                  value={field.value}
                  onChange={(event) => {
                    const selected = event.target.value as string[];
                    const sorted = [...selected].sort(
                      (a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b)
                    );
                    field.onChange(sorted);
                  }}
                  input={<OutlinedInput id="select-times" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                  disabled={isLoading}
                >
                  {TIME_SLOTS.map((time) => (
                    <MenuItem key={time} value={time}>
                      <Checkbox checked={field.value.includes(time)} />
                      <ListItemText primary={time} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.preferredTimes ? (
                  <FormHelperText>{errors.preferredTimes.message}</FormHelperText>
                ) : null}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      {/* Summary */}
      {calculation.totalSessions > 0 && (
        <Alert severity="success" sx={{ mt: 3 }} icon={false}>
          <Typography variant="body2">
            <strong>Zusammenfassung:</strong> {calculation.totalSessions} Sessions à{' '}
            {SESSION_DURATION_LABELS[sessionDurationMinutes]}{' '}
            {isSkillExchange ? '(Skill-Tausch)' : ''}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SessionPlanningSection;
