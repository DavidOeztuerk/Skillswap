import { z } from 'zod';
import {
  EmailSchema,
  IsoDateTimeSchema,
  NonEmptyStringSchema,
  UuidSchema,
} from '../../../shared/schemas/common';

// ============================================
// USER SCHEMAS
// ============================================

/**
 * User Profile Schema
 */
export const UserProfileSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
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
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: IsoDateTimeSchema.optional(),
  lastLoginAt: IsoDateTimeSchema.nullable().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * User Summary Schema (for lists)
 */
export const UserSummarySchema = z.object({
  id: UuidSchema,
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
});

export type UserSummary = z.infer<typeof UserSummarySchema>;

/**
 * Auth Response Schema
 */
export const AuthResponseSchema = z.object({
  accessToken: NonEmptyStringSchema,
  refreshToken: NonEmptyStringSchema.optional(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number().optional(),
  user: UserProfileSchema.optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * Login Request Schema
 */
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Register Request Schema
 */
export const RegisterRequestSchema = z
  .object({
    email: EmailSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    firstName: NonEmptyStringSchema.max(50),
    lastName: NonEmptyStringSchema.max(50),
    acceptTerms: z.boolean().refine((val) => val, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
