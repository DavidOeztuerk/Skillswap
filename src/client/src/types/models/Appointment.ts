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
  skillId: string;
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
  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  isMonetary?: boolean;
  amount?: number;
  currency?: string;
  sessionNumber?: number;
  totalSessions?: number;
  createdAt: string;
}

export enum AppointmentStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}
