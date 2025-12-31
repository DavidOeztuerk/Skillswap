import { z } from 'zod';
import {
  UuidSchema,
  NonEmptyStringSchema,
  IsoDateTimeSchema,
} from '../../../shared/schemas/common';

// ============================================
// SKILL CATEGORY SCHEMAS
// ============================================

/**
 * Skill Category Schema
 */
export const SkillCategorySchema = z.object({
  id: UuidSchema,
  name: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  iconUrl: z
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
      { message: 'Invalid icon URL' }
    )
    .nullable()
    .optional(),
  parentCategoryId: UuidSchema.nullable().optional(),
  skillCount: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export type SkillCategory = z.infer<typeof SkillCategorySchema>;

// ============================================
// PROFICIENCY LEVEL SCHEMAS
// ============================================

/**
 * Proficiency Level Schema
 */
export const ProficiencyLevelSchema = z.object({
  id: UuidSchema,
  name: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  level: z.number().int().min(1).max(10),
  color: z.string().nullable().optional(),
});

export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>;

// ============================================
// SKILL SCHEMAS
// ============================================

/**
 * Skill Schema
 */
export const SkillSchema = z.object({
  id: UuidSchema,
  name: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  categoryId: UuidSchema,
  categoryName: z.string().optional(),
  isVerified: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  usageCount: z.number().int().nonnegative().optional(),
  createdAt: IsoDateTimeSchema.optional(),
});

export type Skill = z.infer<typeof SkillSchema>;

/**
 * User Skill Schema (skill assigned to a user)
 */
export const UserSkillSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  skillId: UuidSchema,
  skillName: NonEmptyStringSchema,
  categoryId: UuidSchema.optional(),
  categoryName: z.string().optional(),
  proficiencyLevelId: UuidSchema,
  proficiencyLevelName: z.string().optional(),
  proficiencyLevel: z.number().int().min(1).max(10).optional(),
  yearsOfExperience: z.number().nonnegative().optional(),
  description: z.string().nullable().optional(),
  isOffered: z.boolean(),
  isWanted: z.boolean(),
  hourlyRate: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(3).nullable().optional(),
  endorsementCount: z.number().int().nonnegative().optional(),
  createdAt: IsoDateTimeSchema.optional(),
  updatedAt: IsoDateTimeSchema.optional(),
});

export type UserSkill = z.infer<typeof UserSkillSchema>;

/**
 * Skill Search Result Schema
 */
export const SkillSearchResultSchema = z.object({
  id: UuidSchema,
  name: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  categoryId: UuidSchema,
  categoryName: z.string().optional(),
  usageCount: z.number().int().nonnegative().optional(),
  matchScore: z.number().optional(),
});

export type SkillSearchResult = z.infer<typeof SkillSearchResultSchema>;

// =============================================================================
// SKILL CONSTANTS FOR VALIDATION
// =============================================================================

/**
 * Valid exchange types for skills (no 'free' - that's for Public Workshops)
 */
const SKILL_EXCHANGE_TYPES = ['skill_exchange', 'payment'] as const;

/**
 * Valid location types
 */
const SKILL_LOCATION_TYPES = ['remote', 'in_person', 'both'] as const;

/**
 * Valid session durations in minutes
 */
const SKILL_SESSION_DURATIONS = [15, 30, 45, 60, 90, 120] as const;

/**
 * Valid weekdays
 */
const SKILL_WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/**
 * Valid time slots
 */
const SKILL_TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;

/**
 * Valid currencies
 */
const SKILL_CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP'] as const;

// =============================================================================
// CREATE SKILL REQUEST SCHEMA
// =============================================================================

/**
 * Create Skill Request Schema
 *
 * Extended with Exchange, Scheduling, and Location validation.
 * NOTE: ExchangeType "free" is NOT available for skills.
 */
export const CreateSkillRequestSchema = z
  .object({
    // Basic fields (required)
    name: NonEmptyStringSchema.min(3, 'Skill name must be at least 3 characters').max(
      100,
      'Skill name must be at most 100 characters'
    ),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must be at most 2000 characters'),
    isOffered: z.boolean(),
    categoryId: UuidSchema,
    proficiencyLevelId: UuidSchema,
    tags: z
      .array(NonEmptyStringSchema.max(50, 'Tag must be at most 50 characters'))
      .max(10, 'Maximum 10 tags allowed')
      .optional(),

    // Legacy fields (optional, for backward compatibility)
    availableHours: z.number().int().nonnegative().optional(),
    preferredSessionDuration: z.number().int().positive().optional(),

    // Exchange options
    exchangeType: z.enum(SKILL_EXCHANGE_TYPES).optional().default('skill_exchange'),
    desiredSkillCategoryId: UuidSchema.optional(),
    desiredSkillDescription: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
    hourlyRate: z
      .number()
      .min(5, 'Hourly rate must be at least 5')
      .max(500, 'Hourly rate must be at most 500')
      .optional(),
    currency: z.enum(SKILL_CURRENCIES).optional(),

    // Scheduling
    preferredDays: z.array(z.enum(SKILL_WEEKDAYS)).optional(),
    preferredTimes: z.array(z.enum(SKILL_TIME_SLOTS)).optional(),
    sessionDurationMinutes: z
      .number()
      .refine(
        (val) => SKILL_SESSION_DURATIONS.includes(val as (typeof SKILL_SESSION_DURATIONS)[number]),
        {
          message: 'Session duration must be 15, 30, 45, 60, 90, or 120 minutes',
        }
      )
      .optional()
      .default(60),
    totalSessions: z
      .number()
      .int()
      .min(1, 'At least 1 session required')
      .max(50, 'Maximum 50 sessions allowed')
      .optional()
      .default(1),

    // Location
    locationType: z.enum(SKILL_LOCATION_TYPES).optional().default('remote'),
    locationAddress: z.string().max(200, 'Address must be at most 200 characters').optional(),
    locationCity: z.string().max(100, 'City must be at most 100 characters').optional(),
    locationPostalCode: z.string().max(20, 'Postal code must be at most 20 characters').optional(),
    locationCountry: z
      .string()
      .length(2, 'Country must be 2-letter ISO code (e.g., DE)')
      .regex(/^[A-Za-z]{2}$/, 'Country must be 2-letter ISO code')
      .optional(),
    maxDistanceKm: z
      .number()
      .int()
      .min(1, 'Max distance must be at least 1 km')
      .max(500, 'Max distance must be at most 500 km')
      .optional()
      .default(50),
  })
  .refine((data) => !(data.exchangeType === 'payment' && !data.isOffered), {
    message: 'Payment exchange type is only allowed when offering a skill (isOffered=true)',
    path: ['exchangeType'],
  })
  .refine((data) => !(data.exchangeType === 'payment' && data.hourlyRate === undefined), {
    message: 'Hourly rate is required for payment exchange type',
    path: ['hourlyRate'],
  })
  .refine(
    (data) =>
      !((data.locationType === 'in_person' || data.locationType === 'both') && !data.locationCity),
    {
      message: 'City is required for in-person skills',
      path: ['locationCity'],
    }
  )
  .refine(
    (data) =>
      !(
        (data.locationType === 'in_person' || data.locationType === 'both') &&
        !data.locationCountry
      ),
    {
      message: 'Country is required for in-person skills',
      path: ['locationCountry'],
    }
  );

export type CreateSkillRequest = z.infer<typeof CreateSkillRequestSchema>;

/**
 * Add User Skill Request Schema
 */
export const AddUserSkillRequestSchema = z
  .object({
    skillId: UuidSchema,
    proficiencyLevelId: UuidSchema,
    isOffered: z.boolean(),
    isWanted: z.boolean(),
    yearsOfExperience: z.number().nonnegative().optional(),
    description: z.string().max(500).optional(),
    hourlyRate: z.number().nonnegative().optional(),
    currency: z.string().max(3).optional(),
  })
  .refine((data) => data.isOffered || data.isWanted, {
    message: 'Skill must be either offered or wanted (or both)',
  });

export type AddUserSkillRequest = z.infer<typeof AddUserSkillRequestSchema>;
