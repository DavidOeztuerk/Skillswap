import { z } from 'zod';
import {
  UuidSchema,
  NonEmptyStringSchema,
  IsoDateTimeSchema,
} from '../../../shared/schemas/common';

// ============================================
// APPOINTMENT STATUS ENUM
// ============================================

export const AppointmentStatusSchema = z.enum([
  'Pending',
  'Confirmed',
  'InProgress',
  'Completed',
  'Cancelled',
  'NoShow',
  'Rescheduled',
  'PaymentPending',
  'PaymentCompleted',
]);

export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

// ============================================
// MEETING TYPE ENUM
// ============================================

export const MeetingTypeSchema = z.enum(['VideoCall', 'InPerson', 'Phone', 'Chat']);

export type MeetingType = z.infer<typeof MeetingTypeSchema>;

// ============================================
// CONNECTION TYPE ENUM
// ============================================

export const ConnectionTypeSchema = z.enum(['SkillExchange', 'Monetary', 'Hybrid']);

export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;

// ============================================
// APPOINTMENT SCHEMAS
// ============================================

/**
 * Appointment Schema
 */
export const AppointmentSchema = z.object({
  id: UuidSchema,
  title: NonEmptyStringSchema,
  description: z.string().nullable().optional(),

  // User information
  organizerUserId: UuidSchema,
  participantUserId: UuidSchema,
  isOrganizer: z.boolean(),
  otherPartyName: z.string().optional(),
  otherPartyUserId: UuidSchema.optional(),

  // Connection information
  connectionId: UuidSchema.optional(),
  connectionType: ConnectionTypeSchema.optional(),
  connectionStatus: z.string().optional(),

  // Session series information
  sessionSeriesId: UuidSchema.optional(),
  sessionSeriesTitle: z.string().optional(),
  sessionNumber: z.number().int().positive().optional(),
  totalSessionsInSeries: z.number().int().positive().optional(),
  completedSessionsInSeries: z.number().int().nonnegative().optional(),

  // Skill information
  skillId: UuidSchema.optional(),

  // Scheduling
  scheduledDate: IsoDateTimeSchema,
  startTime: IsoDateTimeSchema.optional(),
  endTime: IsoDateTimeSchema.optional(),
  durationMinutes: z.number().int().positive().default(60),

  // Status
  status: AppointmentStatusSchema,
  isConfirmed: z.boolean().optional(),

  // Meeting details
  meetingType: MeetingTypeSchema.optional(),
  meetingLink: z
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
      { message: 'Invalid meeting link URL' }
    )
    .nullable()
    .optional(),

  // Payment information
  isPaymentCompleted: z.boolean().optional(),
  paymentAmount: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(3).nullable().optional(),

  // Derived flags
  isSkillExchange: z.boolean().optional(),
  isMonetary: z.boolean().optional(),

  // Timestamps
  createdAt: IsoDateTimeSchema.optional(),
  updatedAt: IsoDateTimeSchema.optional(),

  // Legacy fields
  totalSessions: z.number().int().positive().optional(),
  amount: z.number().nonnegative().nullable().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

/**
 * User Appointment Response Schema (from backend)
 */
export const UserAppointmentResponseSchema = z.object({
  appointmentId: UuidSchema,
  title: NonEmptyStringSchema,
  description: z.string().nullable().optional(),
  skillId: UuidSchema.optional(),
  meetingLink: z
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
      { message: 'Invalid meeting link URL' }
    )
    .nullable()
    .optional(),

  // User relationship
  isOrganizer: z.boolean(),
  otherPartyUserId: UuidSchema,
  otherPartyName: z.string(),

  // Connection info
  connectionId: UuidSchema.optional(),
  connectionType: ConnectionTypeSchema.optional(),
  connectionStatus: z.string().optional(),

  // Session series
  sessionSeriesId: UuidSchema.optional(),
  sessionSeriesTitle: z.string().optional(),
  sessionNumber: z.number().int().positive().optional(),
  totalSessionsInSeries: z.number().int().positive().optional(),
  completedSessionsInSeries: z.number().int().nonnegative().optional(),

  // Scheduling
  scheduledDate: IsoDateTimeSchema,
  durationMinutes: z.number().int().positive().default(60),

  // Status
  status: AppointmentStatusSchema,
  isConfirmed: z.boolean().optional(),

  // Meeting
  meetingType: MeetingTypeSchema.optional(),

  // Payment
  isPaymentCompleted: z.boolean().optional(),
  paymentAmount: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(3).nullable().optional(),

  // Flags
  isSkillExchange: z.boolean().optional(),
  isMonetary: z.boolean().optional(),
});

export type UserAppointmentResponse = z.infer<typeof UserAppointmentResponseSchema>;

/**
 * Create Appointment Request Schema
 */
export const CreateAppointmentRequestSchema = z.object({
  title: NonEmptyStringSchema.max(200),
  description: z.string().max(1000).optional(),
  participantUserId: UuidSchema,
  skillId: UuidSchema.optional(),
  scheduledDate: IsoDateTimeSchema,
  durationMinutes: z.number().int().min(15).max(480).default(60),
  meetingType: MeetingTypeSchema.default('VideoCall'),
  connectionId: UuidSchema.optional(),
});

export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentRequestSchema>;

/**
 * Reschedule Appointment Request Schema
 */
export const RescheduleAppointmentRequestSchema = z.object({
  newDateTime: IsoDateTimeSchema,
  newDurationMinutes: z.number().int().min(15).max(480).optional(),
  reason: z.string().max(500).optional(),
});

export type RescheduleAppointmentRequest = z.infer<typeof RescheduleAppointmentRequestSchema>;
