import { RequestState } from '../common/RequestState';
import { Appointment, AppointmentStatus } from '../models/Appointment';

export interface AppointmentsState extends RequestState {
  appointments: Appointment[];
  activeAppointment: Appointment | undefined;
}

export interface AppointmentFilter {
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
  role?: 'teacher' | 'student';
}
