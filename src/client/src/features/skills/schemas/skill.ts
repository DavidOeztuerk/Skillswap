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

/**
 * Create Skill Request Schema
 */
export const CreateSkillRequestSchema = z.object({
  name: NonEmptyStringSchema.min(2).max(100),
  description: z.string().max(500),
  isOffered: z.boolean(),
  categoryId: UuidSchema,
  proficiencyLevelId: UuidSchema,
  tags: z.array(NonEmptyStringSchema).max(10).optional(),
  availableHours: z.number().int().nonnegative().optional(),
  preferredSessionDuration: z.number().int().positive().optional(),
});

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
