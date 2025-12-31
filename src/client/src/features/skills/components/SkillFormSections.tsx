import React from 'react';
import {
  ExpandMore as ExpandMoreIcon,
  SwapHoriz as SwapIcon,
  Euro as EuroIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Videocam as VideocamIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Stack,
  InputAdornment,
  Alert,
  type SelectChangeEvent,
} from '@mui/material';
import type { CreateSkillRequest } from '../types/CreateSkillRequest';
import type { SkillCategory } from '../types/Skill';

// =============================================================================
// CONSTANTS
// =============================================================================

const SESSION_DURATIONS = [15, 30, 45, 60, 90, 120] as const;
const SESSION_DURATION_LABELS: Record<number, string> = {
  15: '15 Min.',
  30: '30 Min.',
  45: '45 Min.',
  60: '1 Std.',
  90: '1,5 Std.',
  120: '2 Std.',
};

const WEEKDAYS = [
  { value: 'monday', label: 'Mo' },
  { value: 'tuesday', label: 'Di' },
  { value: 'wednesday', label: 'Mi' },
  { value: 'thursday', label: 'Do' },
  { value: 'friday', label: 'Fr' },
  { value: 'saturday', label: 'Sa' },
  { value: 'sunday', label: 'So' },
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Vormittag', desc: '8-12 Uhr' },
  { value: 'afternoon', label: 'Nachmittag', desc: '12-17 Uhr' },
  { value: 'evening', label: 'Abend', desc: '17-21 Uhr' },
];

const CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP'] as const;
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20AC',
  USD: '$',
  CHF: 'CHF',
  GBP: '\u00A3',
};

// =============================================================================
// SHARED TYPES
// =============================================================================

interface BaseSectionProps {
  formValues: CreateSkillRequest;
  loading: boolean;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

// =============================================================================
// SCHEDULING SECTION
// =============================================================================

interface SchedulingSectionProps extends BaseSectionProps {
  onNumberChange: (name: keyof CreateSkillRequest, value: number) => void;
  onArrayToggle: (name: 'preferredDays' | 'preferredTimes', value: string) => void;
  totalHours: number;
  totalMinutes: number;
}

export const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  formValues,
  loading,
  expanded,
  onExpandChange,
  onNumberChange,
  onArrayToggle,
  totalHours,
  totalMinutes,
}) => (
  <Accordion
    expanded={expanded}
    onChange={(_e, isExpanded) => onExpandChange(isExpanded)}
    sx={{ mb: 2 }}
  >
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ScheduleIcon color="action" />
        <Typography fontWeight={500}>Zeitplanung</Typography>
        {(formValues.preferredDays?.length ?? 0) > 0 && (
          <Chip
            size="small"
            label={`${String(formValues.preferredDays?.length ?? 0)} Tage`}
            color="primary"
            variant="outlined"
          />
        )}
      </Stack>
    </AccordionSummary>
    <AccordionDetails>
      <Typography variant="subtitle2" gutterBottom>
        Dauer pro Session
      </Typography>
      <ToggleButtonGroup
        value={formValues.sessionDurationMinutes}
        exclusive
        onChange={(_e, value: number | null) => {
          if (value !== null) onNumberChange('sessionDurationMinutes', value);
        }}
        disabled={loading}
        sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
      >
        {SESSION_DURATIONS.map((duration) => (
          <ToggleButton key={duration} value={duration} sx={{ px: 2, py: 1 }}>
            {SESSION_DURATION_LABELS[duration]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Anzahl Sessions
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            type="number"
            value={formValues.totalSessions}
            onChange={(e) =>
              onNumberChange('totalSessions', Math.max(1, Math.min(50, +e.target.value)))
            }
            disabled={loading}
            size="small"
            slotProps={{ htmlInput: { min: 1, max: 50 } }}
            sx={{ width: 100 }}
          />
          <Typography variant="body2" color="text.secondary">
            = {totalHours > 0 ? `${totalHours}h ` : ''}
            {totalMinutes > 0 ? `${totalMinutes}min` : ''} Gesamtzeit
          </Typography>
        </Stack>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Bevorzugte Tage
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
        {WEEKDAYS.map((day) => (
          <Chip
            key={day.value}
            label={day.label}
            onClick={() => onArrayToggle('preferredDays', day.value)}
            color={formValues.preferredDays?.includes(day.value) ? 'primary' : 'default'}
            variant={formValues.preferredDays?.includes(day.value) ? 'filled' : 'outlined'}
            disabled={loading}
          />
        ))}
      </Stack>

      <Typography variant="subtitle2" gutterBottom>
        Bevorzugte Tageszeit
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {TIME_SLOTS.map((slot) => (
          <Chip
            key={slot.value}
            label={`${slot.label} (${slot.desc})`}
            onClick={() => onArrayToggle('preferredTimes', slot.value)}
            color={formValues.preferredTimes?.includes(slot.value) ? 'primary' : 'default'}
            variant={formValues.preferredTimes?.includes(slot.value) ? 'filled' : 'outlined'}
            disabled={loading}
          />
        ))}
      </Stack>
    </AccordionDetails>
  </Accordion>
);

// =============================================================================
// EXCHANGE SECTION
// =============================================================================

interface ExchangeSectionProps extends BaseSectionProps {
  categories: SkillCategory[];
  hasCategories: boolean;
  errors: Partial<Record<keyof CreateSkillRequest, string>>;
  onFieldChange: (
    e: SelectChangeEvent | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onExchangeTypeChange: (value: 'skill_exchange' | 'payment') => void;
  onNumberChange: (name: keyof CreateSkillRequest, value: number) => void;
  totalDuration: number;
  totalHours: number;
  totalMinutes: number;
}

export const ExchangeSection: React.FC<ExchangeSectionProps> = ({
  formValues,
  loading,
  expanded,
  onExpandChange,
  categories,
  hasCategories,
  errors,
  onFieldChange,
  onExchangeTypeChange,
  onNumberChange,
  totalDuration,
  totalHours,
  totalMinutes,
}) => (
  <Accordion
    expanded={expanded}
    onChange={(_e, isExpanded) => onExpandChange(isExpanded)}
    sx={{ mb: 2 }}
  >
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Stack direction="row" spacing={1} alignItems="center">
        <SwapIcon color="action" />
        <Typography fontWeight={500}>Austausch-Art</Typography>
        <Chip
          size="small"
          label={formValues.exchangeType === 'payment' ? 'Bezahlung' : 'Skill-Tausch'}
          color={formValues.exchangeType === 'payment' ? 'warning' : 'primary'}
          variant="outlined"
        />
      </Stack>
    </AccordionSummary>
    <AccordionDetails>
      <ToggleButtonGroup
        value={formValues.exchangeType}
        exclusive
        onChange={(_e, value: 'skill_exchange' | 'payment' | null) => {
          if (value !== null) onExchangeTypeChange(value);
        }}
        disabled={loading}
        sx={{ mb: 2, width: '100%' }}
      >
        <ToggleButton value="skill_exchange" sx={{ flex: 1, py: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SwapIcon />
            <Typography variant="body2">Skill-Tausch</Typography>
          </Stack>
        </ToggleButton>
        <ToggleButton value="payment" disabled={!formValues.isOffered} sx={{ flex: 1, py: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EuroIcon />
            <Typography variant="body2">Bezahlung</Typography>
          </Stack>
        </ToggleButton>
      </ToggleButtonGroup>

      {!formValues.isOffered && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Bezahlung ist nur möglich, wenn du einen Skill anbietest (nicht suchst).
        </Alert>
      )}

      {errors.exchangeType ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.exchangeType}
        </Alert>
      ) : null}

      {formValues.exchangeType === 'skill_exchange' && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Gewünschter Skill (optional)
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Gewünschte Kategorie</InputLabel>
            <Select
              name="desiredSkillCategoryId"
              value={formValues.desiredSkillCategoryId ?? ''}
              onChange={onFieldChange}
              label="Gewünschte Kategorie"
              disabled={loading}
            >
              <MenuItem value="">Keine Präferenz</MenuItem>
              {hasCategories
                ? categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))
                : null}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Beschreibung des gewünschten Skills"
            name="desiredSkillDescription"
            value={formValues.desiredSkillDescription ?? ''}
            onChange={onFieldChange}
            disabled={loading}
            multiline
            rows={2}
            placeholder="z.B. 'Ich suche jemanden der mir Gitarre beibringen kann'"
          />
        </Box>
      )}

      {formValues.exchangeType === 'payment' && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Stundensatz
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              value={formValues.hourlyRate ?? ''}
              onChange={(e) => onNumberChange('hourlyRate', +e.target.value)}
              disabled={loading}
              size="small"
              error={!!errors.hourlyRate}
              helperText={errors.hourlyRate}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {CURRENCY_SYMBOLS[formValues.currency ?? 'EUR']}
                    </InputAdornment>
                  ),
                },
                htmlInput: { min: 5, max: 500, step: 5 },
              }}
              sx={{ width: 150 }}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                name="currency"
                value={formValues.currency ?? 'EUR'}
                onChange={onFieldChange}
                disabled={loading}
              >
                {CURRENCIES.map((curr) => (
                  <MenuItem key={curr} value={curr}>
                    {curr}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {formValues.hourlyRate !== undefined && formValues.hourlyRate > 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Geschätzter Gesamtpreis: {CURRENCY_SYMBOLS[formValues.currency ?? 'EUR']}
              {((formValues.hourlyRate * totalDuration) / 60).toFixed(2)} (
              {totalHours > 0 ? `${totalHours}h ` : ''}
              {totalMinutes > 0 ? `${totalMinutes}min` : ''})
            </Typography>
          ) : null}
        </Box>
      )}
    </AccordionDetails>
  </Accordion>
);

// =============================================================================
// LOCATION SECTION
// =============================================================================

interface LocationSectionProps extends BaseSectionProps {
  errors: Partial<Record<keyof CreateSkillRequest, string>>;
  onFieldChange: (
    e: SelectChangeEvent | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onLocationTypeChange: (value: 'remote' | 'in_person' | 'both') => void;
  onNumberChange: (name: keyof CreateSkillRequest, value: number) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  formValues,
  loading,
  expanded,
  onExpandChange,
  errors,
  onFieldChange,
  onLocationTypeChange,
  onNumberChange,
}) => {
  const getLocationLabel = (): string => {
    if (formValues.locationType === 'remote') return 'Remote';
    if (formValues.locationType === 'in_person') return 'Vor Ort';
    return 'Beides';
  };

  return (
    <Accordion expanded={expanded} onChange={(_e, isExpanded) => onExpandChange(isExpanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationIcon color="action" />
          <Typography fontWeight={500}>Ort</Typography>
          <Chip size="small" label={getLocationLabel()} color="primary" variant="outlined" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <ToggleButtonGroup
          value={formValues.locationType}
          exclusive
          onChange={(_e, value: 'remote' | 'in_person' | 'both' | null) => {
            if (value !== null) onLocationTypeChange(value);
          }}
          disabled={loading}
          sx={{ mb: 2, width: '100%' }}
        >
          <ToggleButton value="remote" sx={{ flex: 1, py: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <VideocamIcon />
              <Typography variant="body2">Remote</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value="in_person" sx={{ flex: 1, py: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PlaceIcon />
              <Typography variant="body2">Vor Ort</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value="both" sx={{ flex: 1, py: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationIcon />
              <Typography variant="body2">Beides</Typography>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>

        {(formValues.locationType === 'in_person' || formValues.locationType === 'both') && (
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Stadt"
                name="locationCity"
                value={formValues.locationCity ?? ''}
                onChange={onFieldChange}
                disabled={loading}
                required
                error={!!errors.locationCity}
                helperText={errors.locationCity}
              />
              <TextField
                size="small"
                label="PLZ"
                name="locationPostalCode"
                value={formValues.locationPostalCode ?? ''}
                onChange={onFieldChange}
                disabled={loading}
                sx={{ width: { xs: '100%', sm: 120 } }}
              />
              <TextField
                size="small"
                label="Land"
                name="locationCountry"
                value={formValues.locationCountry ?? ''}
                onChange={onFieldChange}
                disabled={loading}
                required
                error={!!errors.locationCountry}
                helperText={errors.locationCountry ?? 'z.B. DE, AT, CH'}
                placeholder="DE"
                slotProps={{ htmlInput: { maxLength: 2 } }}
                sx={{ width: { xs: '100%', sm: 100 } }}
              />
            </Stack>
            <TextField
              fullWidth
              size="small"
              label="Adresse (optional)"
              name="locationAddress"
              value={formValues.locationAddress ?? ''}
              onChange={onFieldChange}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Maximale Entfernung: {formValues.maxDistanceKm} km
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {[10, 25, 50, 100, 200].map((km) => (
                  <Chip
                    key={km}
                    label={`${km} km`}
                    onClick={() => onNumberChange('maxDistanceKm', km)}
                    color={formValues.maxDistanceKm === km ? 'primary' : 'default'}
                    variant={formValues.maxDistanceKm === km ? 'filled' : 'outlined'}
                    disabled={loading}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        )}

        {formValues.locationType === 'remote' && (
          <Alert severity="info">
            Bei Remote-Skills findet der Austausch per Video-Call statt. Es werden keine
            Standortdaten benötigt.
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
