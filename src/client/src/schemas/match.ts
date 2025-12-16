import { z } from 'zod';
import { UuidSchema, IsoDateTimeSchema, NonEmptyStringSchema } from './common';

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
  avatarUrl: z
    .string()
    .refine(
      (val) => {
        try {
          const _url = new URL(val);
          return Boolean(_url);
        } catch {
          return false;
        }
      },
      { message: 'Invalid avatar URL' }
    )
    .nullable()
    .optional(),
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
  requesterAvatarUrl: z
    .string()
    .refine(
      (val) => {
        try {
          const _url = new URL(val);
          return Boolean(_url);
        } catch {
          return false;
        }
      },
      { message: 'Invalid avatar URL' }
    )
    .nullable()
    .optional(),

  targetUserId: UuidSchema,
  targetUserName: z.string().optional(),
  targetUserAvatarUrl: z
    .string()
    .refine(
      (val) => {
        try {
          const _url = new URL(val);
          return Boolean(_url);
        } catch {
          return false;
        }
      },
      { message: 'Invalid avatar URL' }
    )
    .nullable()
    .optional(),

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
  targetUserId: UuidSchema,
  offeredSkillId: UuidSchema,
  wantedSkillId: UuidSchema.optional(),
  matchType: MatchRequestTypeSchema,
  message: z.string().max(500).optional(),
  proposedRate: z.number().nonnegative().optional(),
  currency: z.string().max(3).optional(),
});

export type CreateMatchRequest = z.infer<typeof CreateMatchRequestSchema>;

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
  userAvatarUrl: z
    .string()
    .refine(
      (val) => {
        try {
          const _url = new URL(val);
          return Boolean(_url);
        } catch {
          return false;
        }
      },
      { message: 'Invalid avatar URL' }
    )
    .nullable()
    .optional(),

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
