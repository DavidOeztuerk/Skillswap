import { createEntityAdapter, type EntityState, type EntityId } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { Appointment, AppointmentStatus } from '../types/Appointment';

export const appointmentsAdapter = createEntityAdapter<Appointment, EntityId>({
  selectId: (appointment) => appointment.id,
  sortComparer: (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
});

/*
 * Selectors will filter from entities based on criteria (upcoming/past/status)
 */
export interface AppointmentsEntityState extends EntityState<Appointment, EntityId>, RequestState {
  activeAppointment: Appointment | undefined;
  availableSlots: AvailableSlot[];
  filters: AppointmentFilters;
  pagination: AppointmentPagination;
  isLoadingSlots: boolean;
}

export const initialAppointmentsState: AppointmentsEntityState =
  appointmentsAdapter.getInitialState({
    activeAppointment: undefined,
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
