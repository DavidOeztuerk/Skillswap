import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { Appointment, AppointmentStatus } from "../../types/models/Appointment";
import { RequestState } from "../../types/common/RequestState";

export const appointmentsAdapter = createEntityAdapter<Appointment, EntityId>({
  selectId: (appointment) => {
    // Backend sendet 'appointmentId', Frontend erwartet 'id'
    // Unterstütze beide Feldnamen defensiv
    const id = (appointment as any)?.appointmentId || appointment?.id;

    if (!id) {
      console.error('Appointment ohne ID erkannt:', appointment);
      return `temp-${Date.now()}-${Math.random()}`;
    }
    return id;
  },
  sortComparer: (a, b) => {
    // Backend sendet 'scheduledDate', Frontend erwartet 'startTime'
    // Unterstütze beide Feldnamen defensiv
    const aTime = (a as any)?.scheduledDate || a.startTime;
    const bTime = (b as any)?.scheduledDate || b.startTime;

    return new Date(bTime).getTime() - new Date(aTime).getTime();
  },
});

/**
 * ✅ REFACTORED: Removed duplicate state arrays
 *
 * EntityAdapter provides: entities + ids (normalized state)
 * No need for appointments[], upcomingAppointments[], pastAppointments[]
 *
 * Selectors will filter from entities based on criteria (upcoming/past/status)
 */
export interface AppointmentsEntityState extends EntityState<Appointment, EntityId>, RequestState {
  activeAppointment: Appointment | undefined;
  availableSlots: AvailableSlot[];
  filters: AppointmentFilters;
  pagination: AppointmentPagination;
  isLoadingSlots: boolean;
}

export const initialAppointmentsState: AppointmentsEntityState = appointmentsAdapter.getInitialState({
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
