/**
 * Skill Interface
 *
 * Extended with Exchange, Scheduling, and Location fields.
 */
export interface Skill {
  id: string;
  userId: string;
  ownerUserName?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerRating?: number;
  ownerMemberSince?: string;
  name: string;
  description: string;
  isOffered: boolean;
  category: SkillCategory;
  tagsJson: string;
  averageRating?: number;
  reviewCount?: number;
  estimatedDurationMinutes?: number;
  endorsementCount: number;
  createdAt: string | undefined;
  lastActiveAt?: string;
  matchRequests?: number;
  activeMatches?: number;
  completionRate?: number;
  isVerified?: boolean;
  isFavorite?: boolean;

  // ==========================================================================
  // EXCHANGE OPTIONS
  // ==========================================================================

  /**
   * Type of exchange for this skill
   * - 'skill_exchange': Trade skills with another user
   * - 'payment': Accept payment for teaching
   */
  exchangeType?: 'skill_exchange' | 'payment';

  /**
   * For skill_exchange: Category of the skill the owner wants in return
   */
  desiredSkillCategoryId?: string;

  /**
   * For skill_exchange: Name of the desired category
   */
  desiredSkillCategoryName?: string;

  /**
   * For skill_exchange: Description of what skill the owner is looking for
   */
  desiredSkillDescription?: string;

  /**
   * For skill_exchange when seeking (isOffered=false): ID of own skill to offer in exchange
   */
  offeredSkillId?: string;

  /**
   * For payment: Hourly rate
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
   * Preferred times of day (morning, afternoon, evening)
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
   * Location type: remote, in_person, or both
   */
  locationType?: 'remote' | 'in_person' | 'both';

  /**
   * Street address (for in_person or both)
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

  /**
   * Geocoded latitude (for distance calculations)
   */
  locationLatitude?: number;

  /**
   * Geocoded longitude (for distance calculations)
   */
  locationLongitude?: number;
}

export interface SkillCategory {
  id: string;
  name: string;
  iconName?: string;
  color?: string;
  skillCount?: number;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Valid exchange types for skills
 */
export type SkillExchangeType = 'skill_exchange' | 'payment';

/**
 * Valid location types
 */
export type SkillLocationType = 'remote' | 'in_person' | 'both';

/**
 * Helper to get display label for exchange type (German)
 */
export const getExchangeTypeLabel = (type: SkillExchangeType): string => {
  switch (type) {
    case 'payment':
      return 'Bezahlung';
    case 'skill_exchange':
    default:
      return 'Skill-Tausch';
  }
};

/**
 * Helper to get display label for location type (German)
 */
export const getLocationTypeLabel = (type: SkillLocationType): string => {
  switch (type) {
    case 'in_person':
      return 'Vor Ort';
    case 'both':
      return 'Remote oder Vor Ort';
    case 'remote':
    default:
      return 'Remote';
  }
};

/**
 * Format location string for display
 */
export const formatSkillLocation = (skill: Skill): string => {
  if (skill.locationType === 'remote') {
    return 'Remote';
  }

  const parts: string[] = [];
  if (skill.locationCity) parts.push(skill.locationCity);
  if (skill.locationCountry) parts.push(skill.locationCountry);

  if (parts.length === 0) {
    return skill.locationType === 'both' ? 'Remote oder Vor Ort' : 'Vor Ort';
  }

  const location = parts.join(', ');
  return skill.locationType === 'both' ? `Remote oder ${location}` : location;
};

/**
 * Format scheduling info for display
 */
export const formatSkillSchedule = (skill: Skill): string => {
  const parts: string[] = [];

  if (skill.sessionDurationMinutes !== undefined) {
    const hours = Math.floor(skill.sessionDurationMinutes / 60);
    const mins = skill.sessionDurationMinutes % 60;
    if (hours > 0 && mins > 0) {
      parts.push(`${hours}h ${mins}min pro Session`);
    } else if (hours > 0) {
      parts.push(`${hours}h pro Session`);
    } else {
      parts.push(`${mins}min pro Session`);
    }
  }

  if (skill.totalSessions !== undefined && skill.totalSessions > 1) {
    parts.push(`${skill.totalSessions} Sessions`);
  }

  return parts.join(' • ') || '';
};

/**
 * Calculate total duration in minutes
 */
export const calculateTotalDuration = (skill: Skill): number => {
  const sessionDuration = skill.sessionDurationMinutes ?? 60;
  const totalSessions = skill.totalSessions ?? 1;
  return sessionDuration * totalSessions;
};
