/**
 * Scheduling Constants for Match Requests
 *
 * These constants define the options and labels for the session planning system.
 */

// =============================================================================
// SESSION DURATION OPTIONS
// =============================================================================

/**
 * Available session duration options in minutes
 * Used in SessionSlotDurationSelector
 */
export const SESSION_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
export type SessionDuration = (typeof SESSION_DURATION_OPTIONS)[number];

/**
 * Session duration labels (German)
 */
export const SESSION_DURATION_LABELS: Record<number, string> = {
  15: '15 Min.',
  30: '30 Min.',
  45: '45 Min.',
  60: '1 Std.',
  90: '1,5 Std.',
  120: '2 Std.',
};

// =============================================================================
// TOTAL DURATION LIMITS
// =============================================================================

/**
 * Minimum total learning duration in minutes (30 min)
 */
export const MIN_TOTAL_DURATION_MINUTES = 30;

/**
 * Maximum total learning duration in minutes (20 hours)
 */
export const MAX_TOTAL_DURATION_MINUTES = 1200;

/**
 * Default total duration in minutes (2 hours)
 */
export const DEFAULT_TOTAL_DURATION_MINUTES = 120;

/**
 * Default session duration in minutes (1 hour)
 */
export const DEFAULT_SESSION_DURATION_MINUTES = 60;

/**
 * Minimum session duration in minutes (15 min)
 */
export const MIN_SESSION_DURATION_MINUTES = 15;

/**
 * Maximum session duration in minutes (2 hours)
 */
export const MAX_SESSION_DURATION_MINUTES = 120;

/**
 * Quick select options for total duration (in minutes)
 */
export const QUICK_DURATION_OPTIONS = [60, 120, 240, 480] as const;

/**
 * Quick duration labels (German)
 */
export const QUICK_DURATION_LABELS: Record<number, string> = {
  60: '1 Std.',
  120: '2 Std.',
  240: '4 Std.',
  480: '8 Std.',
};

// =============================================================================
// SESSION LIMITS
// =============================================================================

/**
 * Maximum number of sessions before showing a warning
 */
export const SESSION_WARNING_THRESHOLD = 20;

/**
 * Maximum allowed sessions
 */
export const MAX_SESSIONS = 80;

// =============================================================================
// TIME RANGES
// =============================================================================

/**
 * Time range definitions for quick selection
 */
export const TIME_RANGES = {
  MORNING: {
    id: 'morning',
    label: 'Vormittag',
    description: '8-12 Uhr',
    times: ['08:00', '09:00', '10:00', '11:00'],
  },
  AFTERNOON: {
    id: 'afternoon',
    label: 'Nachmittag',
    description: '12-17 Uhr',
    times: ['12:00', '13:00', '14:00', '15:00', '16:00'],
  },
  EVENING: {
    id: 'evening',
    label: 'Abend',
    description: '17-20 Uhr',
    times: ['17:00', '18:00', '19:00', '20:00'],
  },
} as const;

export type TimeRangeKey = keyof typeof TIME_RANGES;

// =============================================================================
// EXCHANGE TYPES
// =============================================================================

/**
 * Types of exchange for match requests
 *
 * NOTE: 'free' is NOT available for skills or match requests.
 * Free multi-call sessions are only available via Public Workshops (separate feature).
 * See docs/architecture/public-workshop-epic.md for details.
 */
export const EXCHANGE_TYPES = {
  SKILL_EXCHANGE: 'skill_exchange',
  PAYMENT: 'payment',
} as const;

export type ExchangeType = (typeof EXCHANGE_TYPES)[keyof typeof EXCHANGE_TYPES];

/**
 * Exchange type labels and descriptions (German)
 */
export const EXCHANGE_TYPE_CONFIG: Record<
  ExchangeType,
  { label: string; description: string; icon: string }
> = {
  [EXCHANGE_TYPES.SKILL_EXCHANGE]: {
    label: 'Skill-Tausch',
    description: 'Tausche einen deiner Skills gegen den gewünschten Skill',
    icon: 'SwapHoriz',
  },
  [EXCHANGE_TYPES.PAYMENT]: {
    label: 'Bezahlung',
    description: 'Bezahle für die Lernstunden',
    icon: 'Euro',
  },
};

// =============================================================================
// CURRENCY OPTIONS
// =============================================================================

/**
 * Supported currencies for payment
 */
export const CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * Default currency
 */
export const DEFAULT_CURRENCY: Currency = 'EUR';

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '\u20AC',
  USD: '$',
  CHF: 'CHF',
  GBP: '\u00A3',
};

// =============================================================================
// PAYMENT LIMITS
// =============================================================================

/**
 * Minimum hourly rate
 */
export const MIN_HOURLY_RATE = 5;

/**
 * Maximum hourly rate
 */
export const MAX_HOURLY_RATE = 500;

/**
 * Default hourly rate
 */
export const DEFAULT_HOURLY_RATE = 25;

// =============================================================================
// GERMAN LABELS
// =============================================================================

export const SCHEDULING_LABELS = {
  // Section headers
  TOTAL_DURATION: 'Gesamte Lernzeit',
  SESSION_DURATION: 'Dauer pro Session',
  CALCULATED_SESSIONS: 'Berechnete Sessions',
  PREFERRED_SCHEDULE: 'Bevorzugte Zeiten',
  EXCHANGE_TYPE: 'Art des Austauschs',
  OFFER_TYPE: 'Was möchtest du?',

  // Offer/Seek options
  WANT_TO_LEARN: 'Ich möchte lernen',
  WANT_TO_TEACH: 'Ich möchte lehren',

  // Duration selector
  TOTAL_DURATION_QUESTION: 'Wie viel Zeit möchtest du insgesamt investieren?',
  QUICK_SELECT: 'Schnellauswahl:',
  EXACT_INPUT: 'Oder exakt eingeben:',
  HOURS: 'Stunden',
  MINUTES: 'Minuten',

  // Session duration
  SESSION_DURATION_QUESTION: 'Wie lange soll jede einzelne Lerneinheit dauern?',
  SESSION_TIP: 'Tipp: 45-60 Minuten sind ideal für konzentriertes Lernen',

  // Calculation display
  SESSIONS_COUNT: '{count} Sessions',
  TOTAL_TIME: '{time} Gesamtzeit',
  TEACHING_SESSIONS: '{count} Sessions Lehren ({time})',
  LEARNING_SESSIONS: '{count} Sessions Lernen ({time})',
  SKILL_EXCHANGE_SPLIT: 'Bei Skill-Tausch: {teachTime} Lehren + {learnTime} Lernen',

  // Day/Time selection
  WEEKDAYS_LABEL: 'Wochentage',
  TIME_OF_DAY: 'Tageszeit',
  SELECT_AT_LEAST_ONE_DAY: 'Wähle mindestens einen Tag',
  SELECT_AT_LEAST_ONE_TIME: 'Wähle mindestens eine Zeit',

  // Exchange type
  YOUR_EXCHANGE_SKILL: 'Dein Skill zum Tauschen:',
  CREATE_NEW_SKILL: '+ Neuer Skill',
  HOURLY_RATE: 'Betrag pro Stunde:',
  ESTIMATED_TOTAL: 'Geschätzter Gesamtpreis: {amount} ({hours} Stunden)',

  // Warnings
  WARNING_MANY_SESSIONS: 'Viele Sessions geplant. Erwäge längere Einzelsessions.',
  WARNING_EXTRA_TIME: 'Du erhältst {minutes} Minuten zusätzliche Lernzeit',
  INFO_EXCHANGE_REQUIRES_SKILL: 'Für einen Skill-Tausch musst du einen eigenen Skill auswählen',

  // Validation errors
  ERROR_MIN_DURATION: 'Mindestens 30 Minuten Gesamtdauer erforderlich',
  ERROR_MAX_DURATION: 'Maximal 20 Stunden Gesamtdauer erlaubt',
  ERROR_INVALID_SESSION_DURATION: 'Ungültige Session-Dauer',
  ERROR_EXCHANGE_SKILL_REQUIRED: 'Bei Skill-Tausch muss ein eigener Skill ausgewählt werden',
  ERROR_AMOUNT_REQUIRED: 'Bei Bezahlung muss ein Betrag angegeben werden',
  ERROR_MIN_AMOUNT: 'Mindestbetrag: {amount}',
  ERROR_MAX_AMOUNT: 'Maximalbetrag: {amount}',
} as const;

// =============================================================================
// WEEKDAY SHORT LABELS (German)
// =============================================================================

export const WEEKDAY_SHORT_LABELS: Record<string, string> = {
  Monday: 'Mo',
  Tuesday: 'Di',
  Wednesday: 'Mi',
  Thursday: 'Do',
  Friday: 'Fr',
  Saturday: 'Sa',
  Sunday: 'So',
};

/**
 * Get short German label for weekday
 */
export const getWeekdayShortLabel = (day: string): string =>
  WEEKDAY_SHORT_LABELS[day] || day.slice(0, 2);
