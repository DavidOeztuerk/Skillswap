import type { Skill } from '../../skills/types/Skill';
import type { User } from '../../user/types/User';

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
  otherPartyUserId?: string;
  otherPartyName?: string;
  otherPartyAvatarUrl?: string;
  skillId?: string;
  matchId?: string;
  skill?: Skill;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  videocallUrl?: string;
  meetingLink?: string;
  meetingType?: string;
  isOrganizer?: boolean;

  connectionId?: string;
  connectionType?: string;
  connectionStatus?: string;

  // Chat/Thread info - ThreadId from MatchRequest for Chat integration
  threadId?: string;

  sessionSeriesId?: string;
  sessionSeriesTitle?: string;
  sessionNumber?: number;
  totalSessionsInSeries?: number;
  completedSessionsInSeries?: number;

  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  isMonetary?: boolean;
  amount?: number;
  totalSessions?: number;

  isConfirmed?: boolean;
  isPaymentCompleted?: boolean;
  paymentAmount?: number;
  currency?: string;

  createdAt: string;
  updatedAt?: string;
}

export enum AppointmentStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  Rescheduled = 'Rescheduled',
}
