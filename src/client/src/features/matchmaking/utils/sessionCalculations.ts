/**
 * Session Calculation Utilities
 *
 * Functions for calculating session counts, durations, and splits for skill exchanges.
 */

import {
  SESSION_DURATION_LABELS,
  SESSION_WARNING_THRESHOLD,
  MIN_TOTAL_DURATION_MINUTES,
  MAX_TOTAL_DURATION_MINUTES,
} from '../constants/scheduling';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of session calculation
 */
export interface SessionCalculation {
  /** Total number of sessions needed */
  totalSessions: number;
  /** Actual total time in minutes (may be more than requested due to rounding up) */
  actualTotalMinutes: number;
  /** Extra minutes added due to rounding (actualTotal - requestedTotal) */
  extraMinutes: number;
  /** Whether the division was exact (no remainder) */
  isExactDivision: boolean;
  /** Whether the session count exceeds the warning threshold */
  exceedsWarningThreshold: boolean;

  // Skill exchange specific
  /** Number of sessions for teaching (only for skill exchange) */
  teachingSessions?: number;
  /** Number of sessions for learning (only for skill exchange) */
  learningSessions?: number;
  /** Total teaching time in minutes */
  teachingMinutes?: number;
  /** Total learning time in minutes */
  learningMinutes?: number;
}

/**
 * Payment calculation result
 */
export interface PaymentCalculation {
  /** Hourly rate */
  hourlyRate: number;
  /** Currency code */
  currency: string;
  /** Total hours */
  totalHours: number;
  /** Total amount */
  totalAmount: number;
  /** Formatted total amount string */
  formattedAmount: string;
}

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate the number of sessions based on total duration and session duration.
 *
 * @param totalDurationMinutes - Total learning time requested in minutes
 * @param sessionDurationMinutes - Duration of each session in minutes
 * @param isSkillExchange - Whether this is a skill exchange (splits sessions between teaching/learning)
 * @returns SessionCalculation object with all calculated values
 *
 * @example
 * // 4 hours total, 1 hour sessions
 * calculateSessions(240, 60, false)
 * // => { totalSessions: 4, actualTotalMinutes: 240, extraMinutes: 0, isExactDivision: true }
 *
 * @example
 * // 100 minutes total, 45 minute sessions (requires rounding up)
 * calculateSessions(100, 45, false)
 * // => { totalSessions: 3, actualTotalMinutes: 135, extraMinutes: 35, isExactDivision: false }
 *
 * @example
 * // 4 hours skill exchange, 1 hour sessions
 * calculateSessions(240, 60, true)
 * // => { totalSessions: 4, teachingSessions: 2, learningSessions: 2, ... }
 */
export function calculateSessions(
  totalDurationMinutes: number,
  sessionDurationMinutes: number,
  isSkillExchange = false
): SessionCalculation {
  // Handle edge cases
  if (totalDurationMinutes <= 0 || sessionDurationMinutes <= 0) {
    return {
      totalSessions: 0,
      actualTotalMinutes: 0,
      extraMinutes: 0,
      isExactDivision: true,
      exceedsWarningThreshold: false,
    };
  }

  // If session duration is greater than total, we do 1 session of the total duration
  if (sessionDurationMinutes > totalDurationMinutes) {
    const result: SessionCalculation = {
      totalSessions: 1,
      actualTotalMinutes: sessionDurationMinutes,
      extraMinutes: sessionDurationMinutes - totalDurationMinutes,
      isExactDivision: false,
      exceedsWarningThreshold: false,
    };

    if (isSkillExchange) {
      result.teachingSessions = 1;
      result.learningSessions = 0;
      result.teachingMinutes = sessionDurationMinutes;
      result.learningMinutes = 0;
    }

    return result;
  }

  // Calculate total sessions (round up to ensure full coverage)
  const totalSessions = Math.ceil(totalDurationMinutes / sessionDurationMinutes);
  const actualTotalMinutes = totalSessions * sessionDurationMinutes;
  const extraMinutes = actualTotalMinutes - totalDurationMinutes;
  const isExactDivision = extraMinutes === 0;
  const exceedsWarningThreshold = totalSessions > SESSION_WARNING_THRESHOLD;

  const result: SessionCalculation = {
    totalSessions,
    actualTotalMinutes,
    extraMinutes,
    isExactDivision,
    exceedsWarningThreshold,
  };

  // For skill exchange, split sessions evenly between teaching and learning
  if (isSkillExchange) {
    // Teaching party gets the extra session if odd number
    const teachingSessions = Math.ceil(totalSessions / 2);
    const learningSessions = totalSessions - teachingSessions;

    result.teachingSessions = teachingSessions;
    result.learningSessions = learningSessions;
    result.teachingMinutes = teachingSessions * sessionDurationMinutes;
    result.learningMinutes = learningSessions * sessionDurationMinutes;
  }

  return result;
}

/**
 * Calculate payment based on hourly rate and total duration.
 *
 * @param hourlyRate - Rate per hour
 * @param totalDurationMinutes - Total duration in minutes
 * @param currency - Currency code (EUR, USD, etc.)
 * @returns PaymentCalculation object
 */
export function calculatePayment(
  hourlyRate: number,
  totalDurationMinutes: number,
  currency = 'EUR'
): PaymentCalculation {
  const totalHours = totalDurationMinutes / 60;
  const totalAmount = hourlyRate * totalHours;

  // Format amount based on currency
  const formattedAmount = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalAmount);

  return {
    hourlyRate,
    currency,
    totalHours,
    totalAmount,
    formattedAmount,
  };
}

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format duration in minutes to a human-readable German string.
 *
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2 Std." or "1 Std. 30 Min."
 *
 * @example
 * formatDuration(60)   // => "1 Std."
 * formatDuration(90)   // => "1 Std. 30 Min."
 * formatDuration(45)   // => "45 Min."
 * formatDuration(150)  // => "2 Std. 30 Min."
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 Min.';
  if (minutes < 60) return `${minutes} Min.`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} Std.`;
  }

  return `${hours} Std. ${remainingMinutes} Min.`;
}

/**
 * Format duration with explicit hours and minutes parts.
 *
 * @param minutes - Duration in minutes
 * @returns Object with hours and minutes parts
 */
export function parseDuration(minutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return { hours, minutes: mins };
}

/**
 * Convert hours and minutes to total minutes.
 *
 * @param hours - Number of hours
 * @param minutes - Number of minutes
 * @returns Total minutes
 */
export function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/**
 * Get the label for a session duration.
 *
 * @param durationMinutes - Duration in minutes
 * @returns German label or formatted duration if not in predefined options
 */
export function getSessionDurationLabel(durationMinutes: number): string {
  return SESSION_DURATION_LABELS[durationMinutes] || formatDuration(durationMinutes);
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate total duration is within allowed range.
 *
 * @param minutes - Duration to validate
 * @returns Object with isValid and optional error message
 */
export function validateTotalDuration(minutes: number): { isValid: boolean; error?: string } {
  if (minutes < MIN_TOTAL_DURATION_MINUTES) {
    return {
      isValid: false,
      error: `Mindestens ${formatDuration(MIN_TOTAL_DURATION_MINUTES)} erforderlich`,
    };
  }
  if (minutes > MAX_TOTAL_DURATION_MINUTES) {
    return {
      isValid: false,
      error: `Maximal ${formatDuration(MAX_TOTAL_DURATION_MINUTES)} erlaubt`,
    };
  }
  return { isValid: true };
}

/**
 * Check if a session duration option should be disabled based on total duration.
 *
 * @param sessionDuration - Session duration option to check
 * @param totalDuration - Current total duration
 * @returns True if the option should be disabled
 */
export function isSessionDurationDisabled(sessionDuration: number, totalDuration: number): boolean {
  // Disable if session duration is more than double the total duration
  // (would result in only 1 session with lots of wasted time)
  return sessionDuration > totalDuration * 2;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a summary text for the calculated sessions.
 *
 * @param calculation - SessionCalculation result
 * @param sessionDuration - Duration of each session in minutes
 * @returns Summary string in German
 */
export function getSessionSummary(
  calculation: SessionCalculation,
  sessionDuration: number
): string {
  const totalTime = formatDuration(calculation.actualTotalMinutes);
  const sessionText = calculation.totalSessions === 1 ? 'Session' : 'Sessions';

  return `${calculation.totalSessions} ${sessionText} \u00E0 ${getSessionDurationLabel(sessionDuration)} = ${totalTime}`;
}

/**
 * Generate a skill exchange summary text.
 *
 * @param calculation - SessionCalculation result with exchange info
 * @returns Summary string in German or undefined if not an exchange
 */
export function getExchangeSummary(calculation: SessionCalculation): string | undefined {
  if (
    calculation.teachingSessions === undefined ||
    calculation.learningMinutes === undefined ||
    calculation.teachingMinutes === undefined
  ) {
    return undefined;
  }

  const teachTime = formatDuration(calculation.teachingMinutes);
  const learnTime = formatDuration(calculation.learningMinutes);

  return `${teachTime} Lehren + ${learnTime} Lernen`;
}

/**
 * Get warning messages for the current calculation.
 *
 * @param calculation - SessionCalculation result
 * @returns Array of warning messages (can be empty)
 */
export function getCalculationWarnings(calculation: SessionCalculation): string[] {
  const warnings: string[] = [];

  if (calculation.exceedsWarningThreshold) {
    warnings.push('Viele Sessions geplant. Erwäge längere Einzelsessions.');
  }

  if (calculation.extraMinutes > 0 && calculation.extraMinutes >= 15) {
    warnings.push(`Du erhältst ${calculation.extraMinutes} Minuten zusätzliche Lernzeit.`);
  }

  return warnings;
}
