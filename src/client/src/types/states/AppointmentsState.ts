import { Appointment, AppointmentStatus } from '../models/Appointment';
import { SliceError } from '../../store/types';

export interface AvailableSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  userId: string;
}

export interface AppointmentFilters {
  status: 'all' | AppointmentStatus;
  dateRange: { start: Date; end: Date } | null;
  type: 'all' | 'teaching' | 'learning';
}

export interface AppointmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AppointmentsState {
  appointments: Appointment[];
  activeAppointment: Appointment | undefined;
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  availableSlots: AvailableSlot[];
  filters: AppointmentFilters;
  pagination: AppointmentPagination;
  isLoading: boolean;
  isLoadingSlots: boolean;
  error: SliceError | null;
}

export interface AppointmentFilter {
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
  role?: 'teacher' | 'student';
}
