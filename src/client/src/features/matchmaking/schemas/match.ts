import { z } from 'zod';
import {
  UuidSchema,
  NonEmptyStringSchema,
  IsoDateTimeSchema,
} from '../../../shared/schemas/common';
import {
  SESSION_DURATION_OPTIONS,
  MIN_TOTAL_DURATION_MINUTES,
  MAX_TOTAL_DURATION_MINUTES,
  EXCHANGE_TYPES,
  MIN_HOURLY_RATE,
  MAX_HOURLY_RATE,
  CURRENCIES,
} from '../constants/scheduling';

// Constants
const INVALID_AVATAR_URL = 'Invalid avatar URL';

// URL validation helper
const isValidUrl = (val: string): boolean => {
  try {
    const _url = new URL(val);
    return Boolean(_url);
  } catch {
    return false;
  }
};

// Reusable avatar URL schema
const AvatarUrlSchema = z
  .string()
  .refine(isValidUrl, { message: INVALID_AVATAR_URL })
  .nullable()
  .optional();

// ============================================
// MATCH STATUS ENUM
// ============================================

export const MatchStatusSchema = z.enum([
  'Pending',
  'Accepted',
  'Declined',
  'Expired',
  'Cancelled',
  'Connected',
]);

export type MatchStatus = z.infer<typeof MatchStatusSchema>;

// ============================================
// MATCH REQUEST TYPE ENUM
// ============================================

export const MatchRequestTypeSchema = z.enum(['SkillExchange', 'Monetary']);

export type MatchRequestType = z.infer<typeof MatchRequestTypeSchema>;

// ============================================
// EXCHANGE TYPE ENUM (NEW)
// ============================================

export const ExchangeTypeSchema = z.enum([
  EXCHANGE_TYPES.SKILL_EXCHANGE,
  EXCHANGE_TYPES.PAYMENT,
  EXCHANGE_TYPES.FREE,
]);

export type ExchangeType = z.infer<typeof ExchangeTypeSchema>;

// ============================================
// MATCH SCHEMAS
// ============================================

/**
 * Match User Schema
 */
export const MatchUserSchema = z.object({
  userId: UuidSchema,
  firstName: NonEmptyStringSchema,
  lastName: NonEmptyStringSchema,
  displayName: z.string().optional(),
  avatarUrl: AvatarUrlSchema,
  skillId: UuidSchema.optional(),
  skillName: z.string().optional(),
  proficiencyLevel: z.number().int().min(1).max(10).optional(),
});

export type MatchUser = z.infer<typeof MatchUserSchema>;

/**
 * Match Request Schema
 */
export const MatchRequestSchema = z.object({
  id: UuidSchema,
  requesterId: UuidSchema,
  requesterName: z.string().optional(),
  requesterAvatarUrl: AvatarUrlSchema,

  targetUserId: UuidSchema,
  targetUserName: z.string().optional(),
  targetUserAvatarUrl: AvatarUrlSchema,

  // Skills involved
  requesterOfferedSkillId: UuidSchema.optional(),
  requesterOfferedSkillName: z.string().optional(),
  requesterWantedSkillId: UuidSchema.optional(),
  requesterWantedSkillName: z.string().optional(),

  targetOfferedSkillId: UuidSchema.optional(),
  targetOfferedSkillName: z.string().optional(),
  targetWantedSkillId: UuidSchema.optional(),
  targetWantedSkillName: z.string().optional(),

  // Match details
  matchType: MatchRequestTypeSchema,
  status: MatchStatusSchema,
  message: z.string().nullable().optional(),

  // Monetary details
  proposedRate: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(3).nullable().optional(),

  // Scoring
  matchScore: z.number().min(0).max(100).optional(),
  compatibilityScore: z.number().min(0).max(100).optional(),

  // Timestamps
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema.optional(),
  expiresAt: IsoDateTimeSchema.optional(),
  respondedAt: IsoDateTimeSchema.nullable().optional(),
});

export type MatchRequest = z.infer<typeof MatchRequestSchema>;

/**
 * Create Match Request Schema
 */
export const CreateMatchRequestSchema = z.object({
  skillId: UuidSchema,
  targetUserId: UuidSchema,
  offeredSkillId: UuidSchema.optional(),
  matchType: MatchRequestTypeSchema.optional(),
  message: z.string().max(500),
  proposedRate: z.number().nonnegative().optional(),
  currency: z.string().max(3).optional(),
  isSkillExchange: z.boolean().optional(),
  exchangeSkillId: UuidSchema.optional(),
  isMonetary: z.boolean().optional(),
  offeredAmount: z.number().nonnegative().optional(),
  sessionDurationMinutes: z.number().int().positive().optional(),
  totalSessions: z.number().int().positive().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  description: z.string().optional(),
  skillName: z.string().optional(),
  exchangeSkillName: z.string().optional(),
  // NEW: Total duration for intelligent session calculation
  totalDurationMinutes: z.number().int().positive().optional(),
  // NEW: Exchange type (skill_exchange, payment, free)
  exchangeType: ExchangeTypeSchema.optional(),
});

export type CreateMatchRequest = z.infer<typeof CreateMatchRequestSchema>;

// ============================================
// SESSION PLANNING SCHEMA (NEW)
// ============================================

/**
 * Session Planning Form Schema
 * Used in SessionPlanningSection for form validation
 */
export const SessionPlanningSchema = z
  .object({
    // Total learning time in minutes
    totalDurationMinutes: z
      .number()
      .int()
      .min(MIN_TOTAL_DURATION_MINUTES, `Mindestens ${MIN_TOTAL_DURATION_MINUTES} Minuten`)
      .max(MAX_TOTAL_DURATION_MINUTES, `Maximal ${MAX_TOTAL_DURATION_MINUTES} Minuten`),

    // Duration of each session in minutes
    sessionDurationMinutes: z
      .number()
      .int()
      .refine(
        (val) =>
          SESSION_DURATION_OPTIONS.includes(val as (typeof SESSION_DURATION_OPTIONS)[number]),
        {
          message: 'Ungueltige Session-Dauer',
        }
      ),

    // Type of exchange
    exchangeType: ExchangeTypeSchema,

    // For skill exchange: the skill being offered
    exchangeSkillId: z.string().optional(),
    exchangeSkillName: z.string().optional(),

    // For payment: hourly rate and currency
    hourlyRate: z
      .number()
      .min(MIN_HOURLY_RATE, `Mindestens ${MIN_HOURLY_RATE} EUR/Std.`)
      .max(MAX_HOURLY_RATE, `Maximal ${MAX_HOURLY_RATE} EUR/Std.`)
      .optional(),
    currency: z.enum(CURRENCIES).optional(),

    // Preferred schedule
    preferredDays: z.array(z.string()).min(1, 'Waehle mindestens einen Tag'),
    preferredTimes: z.array(z.string()).min(1, 'Waehle mindestens eine Zeit'),

    // Offer or seek
    isOffering: z.boolean(),
  })
  .refine(
    (data) => {
      // If skill exchange, must have exchange skill selected
      if (data.exchangeType === EXCHANGE_TYPES.SKILL_EXCHANGE) {
        return !!data.exchangeSkillId;
      }
      return true;
    },
    {
      message: 'Bei Skill-Tausch muss ein eigener Skill ausgewaehlt werden',
      path: ['exchangeSkillId'],
    }
  )
  .refine(
    (data) => {
      // If payment, must have hourly rate
      if (data.exchangeType === EXCHANGE_TYPES.PAYMENT) {
        return data.hourlyRate !== undefined && data.hourlyRate > 0;
      }
      return true;
    },
    {
      message: 'Bei Bezahlung muss ein Stundensatz angegeben werden',
      path: ['hourlyRate'],
    }
  );

export type SessionPlanningFormValues = z.infer<typeof SessionPlanningSchema>;

/**
 * Respond to Match Request Schema
 */
export const RespondToMatchRequestSchema = z.object({
  accept: z.boolean(),
  message: z.string().max(500).optional(),
  counterRate: z.number().nonnegative().optional(),
});

export type RespondToMatchRequest = z.infer<typeof RespondToMatchRequestSchema>;

/**
 * Match Suggestion Schema (for matchmaking algorithm results)
 */
export const MatchSuggestionSchema = z.object({
  userId: UuidSchema,
  userName: NonEmptyStringSchema,
  userAvatarUrl: AvatarUrlSchema,

  offeredSkillId: UuidSchema,
  offeredSkillName: NonEmptyStringSchema,
  offeredProficiencyLevel: z.number().int().min(1).max(10).optional(),

  wantedSkillId: UuidSchema.optional(),
  wantedSkillName: z.string().optional(),

  matchScore: z.number().min(0).max(100),
  compatibilityFactors: z.array(z.string()).optional(),
  distance: z.number().nonnegative().nullable().optional(),
});

export type MatchSuggestion = z.infer<typeof MatchSuggestionSchema>;
