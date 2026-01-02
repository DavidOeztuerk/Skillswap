import React, { useMemo } from 'react';
import {
  School as SchoolIcon,
  MenuBook as LearnIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Box, Typography, Paper, LinearProgress, Stack, Alert, Chip } from '@mui/material';
import { SCHEDULING_LABELS } from '../../constants/scheduling';
import {
  calculateSessions,
  formatDuration,
  getSessionDurationLabel,
  getCalculationWarnings,
  type SessionCalculation,
} from '../../utils/sessionCalculations';

// =============================================================================
// TYPES
// =============================================================================

interface SessionCalculationDisplayProps {
  /** Total duration in minutes */
  totalDurationMinutes: number;
  /** Duration of each session in minutes */
  sessionDurationMinutes: number;
  /** Whether this is a skill exchange */
  isSkillExchange?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SessionCalculationDisplay - Shows the calculated number of sessions
 * based on total duration and session duration.
 *
 * Features:
 * - Visual progress bar showing total time
 * - Session count with large typography
 * - Skill exchange split visualization
 * - Warnings for edge cases (many sessions, extra time)
 */
export const SessionCalculationDisplay: React.FC<SessionCalculationDisplayProps> = ({
  totalDurationMinutes,
  sessionDurationMinutes,
  isSkillExchange = false,
  compact = false,
}) => {
  // Calculate sessions
  const calculation = useMemo<SessionCalculation>(
    () => calculateSessions(totalDurationMinutes, sessionDurationMinutes, isSkillExchange),
    [totalDurationMinutes, sessionDurationMinutes, isSkillExchange]
  );

  // Get warnings
  const warnings = useMemo(() => getCalculationWarnings(calculation), [calculation]);

  // Progress percentage (capped at 100%)
  const progressPercent = useMemo(() => {
    if (calculation.actualTotalMinutes === 0) return 0;
    return Math.min(100, (totalDurationMinutes / calculation.actualTotalMinutes) * 100);
  }, [totalDurationMinutes, calculation.actualTotalMinutes]);

  if (compact) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight={700} color="primary">
            {calculation.totalSessions}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {calculation.totalSessions === 1 ? 'Session' : 'Sessions'} \u00E0{' '}
            {getSessionDurationLabel(sessionDurationMinutes)}
          </Typography>
          {calculation.exceedsWarningThreshold ? (
            <WarningIcon color="warning" fontSize="small" />
          ) : null}
        </Stack>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Section Header */}
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {SCHEDULING_LABELS.CALCULATED_SESSIONS}
      </Typography>

      {/* Main Display Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: 'primary.lighter',
          border: 1,
          borderColor: 'primary.light',
          borderRadius: 2,
        }}
      >
        {/* Session Count */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h2"
            component="div"
            fontWeight={700}
            color="primary.main"
            sx={{ lineHeight: 1 }}
          >
            {calculation.totalSessions}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {calculation.totalSessions === 1 ? 'Session' : 'Sessions'}
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 12,
              borderRadius: 1,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                bgcolor: calculation.isExactDivision ? 'success.main' : 'primary.main',
              },
            }}
          />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(totalDurationMinutes)} geplant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(calculation.actualTotalMinutes)} total
            </Typography>
          </Stack>
        </Box>

        {/* Session Info Chips */}
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={1}>
          <Chip
            icon={<CheckCircleIcon />}
            label={`${calculation.totalSessions} \u00D7 ${getSessionDurationLabel(sessionDurationMinutes)}`}
            color="primary"
            variant="outlined"
          />
          <Chip label={`= ${formatDuration(calculation.actualTotalMinutes)}`} variant="outlined" />
        </Stack>

        {/* Skill Exchange Split */}
        {isSkillExchange &&
        calculation.teachingSessions !== undefined &&
        calculation.learningSessions !== undefined ? (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1, textAlign: 'center' }}
            >
              Aufteilung bei Skill-Tausch:
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              {/* Teaching Sessions */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  flex: 1,
                  textAlign: 'center',
                  bgcolor: 'info.lighter',
                  borderColor: 'info.light',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <SchoolIcon color="info" />
                  <Typography variant="subtitle2" color="info.main">
                    Lehren
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight={600} color="info.dark">
                  {calculation.teachingSessions} Sessions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDuration(calculation.teachingMinutes ?? 0)}
                </Typography>
              </Paper>

              {/* Learning Sessions */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  flex: 1,
                  textAlign: 'center',
                  bgcolor: 'success.lighter',
                  borderColor: 'success.light',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <LearnIcon color="success" />
                  <Typography variant="subtitle2" color="success.main">
                    Lernen
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight={600} color="success.dark">
                  {calculation.learningSessions} Sessions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDuration(calculation.learningMinutes ?? 0)}
                </Typography>
              </Paper>
            </Stack>
          </Box>
        ) : null}
      </Paper>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {warnings.map((warning) => (
            <Alert key={warning} severity="warning" icon={<WarningIcon fontSize="small" />}>
              {warning}
            </Alert>
          ))}
        </Stack>
      )}

      {/* Extra Time Info */}
      {calculation.extraMinutes > 0 && calculation.extraMinutes < 15 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Du erhältst {calculation.extraMinutes} Minuten zusätzliche Lernzeit.
        </Alert>
      )}
    </Box>
  );
};

export default SessionCalculationDisplay;
