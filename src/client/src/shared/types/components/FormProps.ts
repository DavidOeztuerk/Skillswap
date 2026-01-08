/**
 * Form Component Props
 *
 * Standardized prop types for form-related components.
 * Use these types to ensure consistency across all forms.
 */

import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import type { FieldValues, UseFormReturn, SubmitHandler } from 'react-hook-form';

// ============================================================================
// Base Form Props
// ============================================================================

/**
 * Base props for all form components
 */
export interface BaseFormProps {
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Whether form is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Success callback */
  onSuccess?: () => void;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for form dialog components
 */
export interface FormDialogProps extends BaseFormProps {
  /** Whether dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Maximum dialog width */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether dialog is fullscreen on mobile */
  fullScreenOnMobile?: boolean;
}

/**
 * Props for form field wrapper components
 */
export interface FormFieldProps {
  /** Field name for form binding */
  name: string;
  /** Field label */
  label: string;
  /** Helper text below field */
  helperText?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Auto focus on mount */
  autoFocus?: boolean;
}

// ============================================================================
// Auth Form Props
// ============================================================================

/**
 * Props for login form component
 */
export interface LoginFormProps extends BaseFormProps {
  /** Callback after successful login */
  onSuccess?: () => void;
  /** Show "Remember Me" checkbox */
  showRememberMe?: boolean;
  /** Show "Forgot Password" link */
  showForgotPassword?: boolean;
  /** Show "Register" link */
  showRegisterLink?: boolean;
}

/**
 * Props for register form component
 */
export interface RegisterFormProps extends BaseFormProps {
  /** Callback after successful registration */
  onSuccess?: () => void;
  /** Show login link */
  showLoginLink?: boolean;
  /** Terms acceptance required */
  requireTermsAcceptance?: boolean;
}

/**
 * Props for password reset form
 */
export interface PasswordResetFormProps extends BaseFormProps {
  /** Reset token from email */
  token?: string;
  /** Email address (for request form) */
  email?: string;
  /** Callback after successful reset */
  onSuccess?: () => void;
}

/**
 * Props for 2FA input component
 */
export interface TwoFactorInputProps {
  /** Number of digits */
  length?: number;
  /** Value change handler */
  onChange: (code: string) => void;
  /** Current value */
  value?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Auto submit when complete */
  autoSubmit?: boolean;
}

// ============================================================================
// Match Form Props
// ============================================================================

/**
 * Props for match request form
 */
export interface MatchFormProps extends FormDialogProps {
  /** Submit handler */
  onSubmit: (data: MatchFormData) => Promise<boolean>;
  /** Target skill for the match */
  skillId: string;
  /** Target user ID */
  targetUserId: string;
  /** Target user display name */
  targetUserName?: string;
  /** User's available skills for exchange */
  userSkills?: { id: string; name: string }[];
}

/**
 * Match form data structure
 */
export interface MatchFormData {
  skillId: string;
  description?: string;
  message?: string;
  isOffering: boolean;
  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  preferredDays: string[];
  preferredTimes: string[];
  additionalNotes?: string;
}

// ============================================================================
// Profile Form Props
// ============================================================================

/**
 * Props for profile edit form
 */
export interface ProfileFormProps extends BaseFormProps {
  /** Initial profile data */
  initialData?: ProfileFormData;
  /** Submit handler */
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

/**
 * Profile form data structure
 */
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
}

// ============================================================================
// Skill Form Props
// ============================================================================

/**
 * Props for skill creation/edit form
 */
export interface SkillFormProps extends FormDialogProps {
  /** Initial skill data (for editing) */
  initialData?: SkillFormData;
  /** Submit handler */
  onSubmit: (data: SkillFormData) => Promise<boolean>;
  /** Available categories */
  categories?: { id: string; name: string }[];
}

/**
 * Skill form data structure
 */
export interface SkillFormData {
  name: string;
  description?: string;
  categoryId: string;
  yearsOfExperience?: number;
  tags?: string[];
}

// ============================================================================
// Appointment Form Props
// ============================================================================

/**
 * Props for appointment scheduling form
 */
export interface AppointmentFormProps extends FormDialogProps {
  /** Match ID for the appointment */
  matchId: string;
  /** Partner user ID */
  partnerId: string;
  /** Partner display name */
  partnerName?: string;
  /** Submit handler */
  onSubmit: (data: AppointmentFormData) => Promise<boolean>;
  /** Available time slots */
  availableSlots?: { date: string; times: string[] }[];
}

/**
 * Appointment form data structure
 */
export interface AppointmentFormData {
  title: string;
  description?: string;
  scheduledDate: string;
  durationMinutes: number;
  isSkillExchange?: boolean;
  notes?: string;
}

// ============================================================================
// Generic Form Wrapper Props
// ============================================================================

/**
 * Generic props for form wrapper components with react-hook-form
 */
export interface FormWrapperProps<T extends FieldValues> {
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Submit handler */
  onSubmit: SubmitHandler<T>;
  /** Form children */
  children: ReactNode;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for controlled input components
 */
export interface ControlledInputProps<T extends FieldValues> extends FormFieldProps {
  /** Form control from react-hook-form */
  control: UseFormReturn<T>['control'];
}
