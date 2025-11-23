import { Skill } from './Skill';
import { User } from './User';

export interface Appointment {
  id: string;
  title?: string;
  description?: string;
  teacherId?: string;
  teacherDetails?: User;
  studentId?: string;
  studentDetails?: User;
  organizerUserId?: string;
  participantUserId?: string;
  otherPartyUserId?: string; // From list endpoint
  otherPartyName?: string;   // From list endpoint
  otherPartyAvatarUrl?: string; // From list endpoint
  skillId?: string;
  matchId?: string;
  skill?: Skill;
  scheduledDate: string;
  startTime: string;  // Always required for display
  endTime: string;    // Always required for display
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  videocallUrl?: string;
  meetingLink?: string;
  meetingType?: string;
  isOrganizer?: boolean; // Whether current user is organizer

  // Connection-level data (NEW MODEL)
  connectionId?: string;
  connectionType?: string; // "SkillExchange" | "Payment" | "Free"
  connectionStatus?: string;

  // Series-level data (NEW MODEL)
  sessionSeriesId?: string;
  sessionSeriesTitle?: string;
  sessionNumber?: number;
  totalSessionsInSeries?: number;
  completedSessionsInSeries?: number;

  // Derived flags (for backward compatibility)
  isSkillExchange?: boolean; // true if connectionType === "SkillExchange"
  isMonetary?: boolean;      // true if connectionType === "Payment"

  // Session-specific data
  isConfirmed?: boolean;
  isPaymentCompleted?: boolean;
  paymentAmount?: number;
  currency?: string;

  // Legacy compatibility
  exchangeSkillId?: string;
  amount?: number; // @deprecated use paymentAmount
  totalSessions?: number; // @deprecated use totalSessionsInSeries

  createdAt: string;
  updatedAt?: string;
}

export enum AppointmentStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed', // NEW: Backend uses "Confirmed" for SessionAppointments
  Accepted = 'Accepted',   // LEGACY: Old appointments may still use "Accepted"
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  Rescheduled = 'Rescheduled'
}
