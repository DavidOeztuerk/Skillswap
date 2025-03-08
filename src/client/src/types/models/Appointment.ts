import { Skill } from './Skill';
import { User } from './User';

export interface Appointment {
  id: string;
  teacherId: string;
  teacherDetails: User;
  studentId: string;
  studentDetails: User;
  skillId: string;
  skill: Skill;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  videocallUrl?: string;
  createdAt: string;
}

export enum AppointmentStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}
