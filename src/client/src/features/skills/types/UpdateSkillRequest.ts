/**
 * Update Skill Request
 *
 * Extended with Exchange, Scheduling, and Location options.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateSkillRequest {
  skillId: string;

  // Basic fields
  name?: string;
  description?: string;
  isOffered?: boolean; // true = offering, false = seeking to learn
  categoryId?: string;
  proficiencyLevelId?: string;
  tags?: string[];

  // Legacy fields
  availableHours?: number;
  preferredSessionDuration?: number;

  // ==========================================================================
  // EXCHANGE OPTIONS
  // ==========================================================================

  /**
   * Type of exchange for this skill
   * - 'skill_exchange': Trade skills with another user
   * - 'payment': Accept payment for teaching (only when isOffered=true)
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
   * For payment: Hourly rate (only valid when isOffered=true and exchangeType='payment')
   */
  hourlyRate?: number;

  /**
   * For payment: Currency code (EUR, USD, CHF, GBP)
   */
  currency?: string;

  // ==========================================================================
  // SCHEDULING
  // ==========================================================================

  /**
   * Preferred days of the week
   */
  preferredDays?: string[];

  /**
   * Preferred times of day
   */
  preferredTimes?: string[];

  /**
   * Duration of each session in minutes
   */
  sessionDurationMinutes?: number;

  /**
   * Total number of sessions
   */
  totalSessions?: number;

  // ==========================================================================
  // LOCATION
  // ==========================================================================

  /**
   * Location type for skill exchange
   */
  locationType?: 'remote' | 'in_person' | 'both';

  /**
   * Street address
   */
  locationAddress?: string;

  /**
   * City name
   */
  locationCity?: string;

  /**
   * Postal code
   */
  locationPostalCode?: string;

  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  locationCountry?: string;

  /**
   * Maximum distance in km for in-person meetings
   */
  maxDistanceKm?: number;
}
