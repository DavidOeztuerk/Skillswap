/**
 * Create Skill Request
 *
 * Extended with Exchange, Scheduling, and Location options.
 * NOTE: ExchangeType "free" is NOT available for skills - only skill_exchange and payment.
 * Public Workshops (free multi-call) are a separate feature (see docs/architecture/public-workshop-epic.md)
 */
export interface CreateSkillRequest {
  // Basic fields (required)
  name: string;
  description: string;
  isOffered: boolean; // true = offering/teaching, false = seeking/learning
  categoryId: string;
  tags?: string[];

  // ==========================================================================
  // IMAGE OPTIONS
  // ==========================================================================

  /**
   * Image option for the skill
   * - 'none': No image, show category letter (default)
   * - 'profile': Use the user's profile photo
   * - 'upload': Upload a new custom image
   */
  imageOption?: 'none' | 'profile' | 'upload';

  /**
   * For upload: Base64-encoded image data
   */
  imageData?: string;

  /**
   * For upload: Original filename
   */
  imageFileName?: string;

  /**
   * For upload: Content type (e.g., 'image/jpeg', 'image/png')
   */
  imageContentType?: string;

  // Legacy fields (optional, for backward compatibility)
  availableHours?: number;
  preferredSessionDuration?: number;

  // ==========================================================================
  // EXCHANGE OPTIONS (optional, default: skill_exchange)
  // ==========================================================================

  /**
   * Type of exchange for this skill
   * - 'skill_exchange': Trade skills with another user
   * - 'payment': Accept payment for teaching (only when isOffered=true)
   *
   * NOTE: 'free' is NOT an option for skills. Public Workshops are a separate feature.
   */
  exchangeType?: 'skill_exchange' | 'payment';

  /**
   * For skill_exchange: Category of the skill you want in return
   */
  desiredSkillCategoryId?: string;

  /**
   * For skill_exchange: Description of what skill you're looking for
   */
  desiredSkillDescription?: string;

  /**
   * For skill_exchange when seeking (isOffered=false): ID of own skill to offer in exchange
   * This allows users to select one of their own offered skills as a counter-offer
   */
  offeredSkillId?: string;

  /**
   * For payment: Hourly rate (only valid when isOffered=true and exchangeType='payment')
   * Min: 5, Max: 500
   */
  hourlyRate?: number;

  /**
   * For payment: Currency code (EUR, USD, CHF, GBP)
   */
  currency?: string;

  // ==========================================================================
  // SCHEDULING (required for matching)
  // ==========================================================================

  /**
   * Preferred days of the week
   * Values: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
   */
  preferredDays?: string[];

  /**
   * Preferred times of day
   * Values: 'morning', 'afternoon', 'evening'
   */
  preferredTimes?: string[];

  /**
   * Duration of each session in minutes
   * Valid values: 15, 30, 45, 60, 90, 120
   * Default: 60
   */
  sessionDurationMinutes?: number;

  /**
   * Total number of sessions to complete the skill exchange
   * Min: 1, Max: 50
   * Default: 1
   */
  totalSessions?: number;

  // ==========================================================================
  // LOCATION (optional, default: remote)
  // ==========================================================================

  /**
   * Location type for skill exchange
   * - 'remote': Online only (default)
   * - 'in_person': In-person only (requires city + country)
   * - 'both': Either remote or in-person
   */
  locationType?: 'remote' | 'in_person' | 'both';

  /**
   * Street address (for in_person or both)
   */
  locationAddress?: string;

  /**
   * City name (required for in_person or both)
   */
  locationCity?: string;

  /**
   * Postal code (for in_person or both)
   */
  locationPostalCode?: string;

  /**
   * Country code (ISO 3166-1 alpha-2, e.g., 'DE', 'AT', 'CH')
   * Required for in_person or both
   */
  locationCountry?: string;

  /**
   * Maximum distance in km for in-person meetings
   * Default: 50, Min: 1, Max: 500
   */
  maxDistanceKm?: number;
}

// =============================================================================
// TYPE GUARDS AND HELPERS
// =============================================================================

/**
 * Valid exchange types for skills (no 'free' - that's for Public Workshops)
 */
export const SKILL_EXCHANGE_TYPES = ['skill_exchange', 'payment'] as const;
export type SkillExchangeType = (typeof SKILL_EXCHANGE_TYPES)[number];

/**
 * Valid location types
 */
export const SKILL_LOCATION_TYPES = ['remote', 'in_person', 'both'] as const;
export type SkillLocationType = (typeof SKILL_LOCATION_TYPES)[number];

/**
 * Valid session durations in minutes
 */
export const SKILL_SESSION_DURATIONS = [15, 30, 45, 60, 90, 120] as const;
export type SkillSessionDuration = (typeof SKILL_SESSION_DURATIONS)[number];

/**
 * Valid weekdays
 */
export const SKILL_WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
export type SkillWeekday = (typeof SKILL_WEEKDAYS)[number];

/**
 * Valid time slots
 */
export const SKILL_TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;
export type SkillTimeSlot = (typeof SKILL_TIME_SLOTS)[number];

/**
 * Check if exchange type requires payment fields
 */
export const isPaymentExchange = (exchangeType?: string): exchangeType is 'payment' =>
  exchangeType === 'payment';

/**
 * Check if location type requires address fields
 */
export const requiresLocationDetails = (
  locationType?: string
): locationType is 'in_person' | 'both' => locationType === 'in_person' || locationType === 'both';
