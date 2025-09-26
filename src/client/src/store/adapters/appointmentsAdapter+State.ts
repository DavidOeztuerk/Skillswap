import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { Appointment, AppointmentStatus } from "../../types/models/Appointment";
import { RequestState } from "../../types/common/RequestState";

export const appointmentsAdapter = createEntityAdapter<Appointment, EntityId>({
  selectId: (appointment) => appointment.id,
  sortComparer: (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
});

export interface AppointmentsEntityState extends EntityState<Appointment, EntityId>, RequestState {
  appointments: Appointment[];
  activeAppointment: Appointment | undefined;
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  availableSlots: AvailableSlot[];
  filters: AppointmentFilters;
  pagination: AppointmentPagination;
  isLoadingSlots: boolean;
}

export const initialAppointmentsState: AppointmentsEntityState = appointmentsAdapter.getInitialState({
  appointments: [],
  activeAppointment: undefined,
  upcomingAppointments: [],
  pastAppointments: [],
  availableSlots: [],
  filters: {
    status: 'all',
    dateRange: null,
    type: 'all',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingSlots: false,
  errorMessage: undefined,
});

export const appointmentsSelectors = appointmentsAdapter.getSelectors();


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

export interface AppointmentFilter {
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
  role?: 'teacher' | 'student';
}
