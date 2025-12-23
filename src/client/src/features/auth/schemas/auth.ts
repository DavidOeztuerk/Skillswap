/**
 * Authentication Validation Schemas
 *
 * Zod schemas for auth-related form validation.
 * Centralized schemas to ensure consistent validation across auth components.
 */

import { z } from 'zod';

// ============================================================================
// Common Auth Field Schemas
// ============================================================================

/**
 * Email field validation
 */

export const emailSchema = z.email('Ungültige E-Mail-Adresse').min(1, 'E-Mail ist erforderlich');

/**
 * Password field validation (for login - less strict)
 */
export const passwordSchema = z
  .string()
  .min(1, 'Passwort ist erforderlich')
  .min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein')
  .max(128, 'Passwort ist zu lang');

/**
 * Strong password validation (for registration)
 */
export const strongPasswordSchema = z
  .string()
  .min(1, 'Passwort ist erforderlich')
  .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
  .max(128, 'Passwort ist zu lang')
  .regex(/[A-Z]/, 'Das Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Das Passwort muss mindestens eine Zahl enthalten')
  .regex(/[^A-Za-z0-9]/, 'Das Passwort muss mindestens ein Sonderzeichen enthalten');

/**
 * Two-factor code validation
 */
export const twoFactorCodeSchema = z
  .string()
  .length(6, 'Der Code muss 6 Ziffern lang sein')
  .regex(/^\d+$/, 'Der Code darf nur Ziffern enthalten');

// ============================================================================
// Login Schema
// ============================================================================

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean(),
  twoFactorCode: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ============================================================================
// Registration Schema
// ============================================================================

/**
 * Registration form validation schema
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
    firstName: z
      .string()
      .min(1, 'Vorname ist erforderlich')
      .min(2, 'Der Vorname muss mindestens 2 Zeichen lang sein')
      .max(50, 'Der Vorname darf maximal 50 Zeichen lang sein'),
    lastName: z
      .string()
      .min(1, 'Nachname ist erforderlich')
      .min(2, 'Der Nachname muss mindestens 2 Zeichen lang sein')
      .max(50, 'Der Nachname darf maximal 50 Zeichen lang sein'),
    acceptTerms: z.boolean().refine((val) => val, {
      message: 'Du musst die Nutzungsbedingungen akzeptieren',
    }),
    acceptPrivacy: z.boolean().refine((val) => val, {
      message: 'Du musst die Datenschutzerklärung akzeptieren',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ============================================================================
// Password Reset Schema
// ============================================================================

/**
 * Password reset request (forgot password) schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Password reset (new password) schema
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token ist erforderlich'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// Change Password Schema
// ============================================================================

/**
 * Change password (authenticated user) schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Das neue Passwort muss sich vom aktuellen unterscheiden',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// ============================================================================
// Two-Factor Authentication Schemas
// ============================================================================

/**
 * 2FA setup schema
 */
export const setup2FASchema = z.object({
  verificationCode: twoFactorCodeSchema,
});

export type Setup2FAFormValues = z.infer<typeof setup2FASchema>;

/**
 * 2FA verification schema
 */
export const verify2FASchema = z.object({
  code: twoFactorCodeSchema,
  trustDevice: z.boolean().default(false),
});

export type Verify2FAFormValues = z.infer<typeof verify2FASchema>;

// ============================================================================
// Phone Verification Schema
// ============================================================================

/**
 * Phone number validation schema
 */
export const phoneNumberSchema = z
  .string()
  .min(1, 'Telefonnummer ist erforderlich')
  .regex(/^\+?[1-9]\d{6,14}$/, 'Ungültige Telefonnummer');

/**
 * Phone verification schema
 */
export const phoneVerificationSchema = z.object({
  phoneNumber: phoneNumberSchema,
  verificationCode: z.string().optional(),
});

export type PhoneVerificationFormValues = z.infer<typeof phoneVerificationSchema>;
