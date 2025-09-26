import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { selectAuthUser } from './authSelectors';

/**
 * Appointments Selectors
 * Centralized selectors for appointments state and entity operations
 */

// Base selectors
export const selectAppointmentsState = (state: RootState) => state.appointments;
export const selectAppointmentsLoading = (state: RootState) => state.appointments.isLoading;
export const selectAppointmentsError = (state: RootState) => state.appointments.errorMessage;
export const selectIsLoadingSlots = (state: RootState) => state.appointments.isLoadingSlots;

// Entity selectors using the normalized structure
export const selectAllAppointments = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => Object.values(appointmentsState.entities).filter(Boolean)
);

export const selectAppointmentById = createSelector(
  [selectAppointmentsState, (_: RootState, appointmentId: string) => appointmentId],
  (appointmentsState, appointmentId) => 
    appointmentsState.entities[appointmentId] || null
);

export const selectActiveAppointment = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.activeAppointment
);

export const selectUpcomingAppointments = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.upcomingAppointments
);

export const selectPastAppointments = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.pastAppointments
);

export const selectAvailableSlots = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.availableSlots
);

// Computed selectors
export const selectUpcomingAppointmentsSorted = createSelector(
  [selectAllAppointments],
  (appointments) => {
    const now = new Date();
    return appointments
      .filter(appointment => 
        new Date(appointment.startTime) > now && 
        appointment.status === 'Confirmed'
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
);

export const selectPastAppointmentsSorted = createSelector(
  [selectAllAppointments],
  (appointments) => {
    const now = new Date();
    return appointments
      .filter(appointment => 
        new Date(appointment.startTime) <= now || 
        appointment.status === 'Completed'
      )
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
);

// User-specific selectors
export const selectUserAppointments = createSelector(
  [selectAllAppointments, selectAuthUser],
  (appointments, user) => {
    if (!user?.id) return [];
    return appointments.filter(appointment => 
      appointment.studentId === user.id || 
      appointment.teacherId === user.id
    );
  }
);

export const selectUserUpcomingAppointments = createSelector(
  [selectUpcomingAppointmentsSorted, selectAuthUser],
  (upcomingAppointments, user) => {
    if (!user?.id) return [];
    return upcomingAppointments.filter(appointment => 
      appointment.studentId === user.id || 
      appointment.teacherId === user.id
    );
  }
);

export const selectUserPastAppointments = createSelector(
  [selectPastAppointmentsSorted, selectAuthUser],
  (pastAppointments, user) => {
    if (!user?.id) return [];
    return pastAppointments.filter(appointment => 
      appointment.studentId === user.id || 
      appointment.teacherId === user.id
    );
  }
);

export const selectTeachingAppointments = createSelector(
  [selectUserAppointments, selectAuthUser],
  (userAppointments, user) => {
    if (!user?.id) return [];
    return userAppointments.filter(appointment => appointment.teacherId === user.id);
  }
);

export const selectLearningAppointments = createSelector(
  [selectUserAppointments, selectAuthUser],
  (userAppointments, user) => {
    if (!user?.id) return [];
    return userAppointments.filter(appointment => appointment.studentId === user.id);
  }
);

// Status-based selectors
export const selectAppointmentsByStatus = createSelector(
  [selectAllAppointments, (_: RootState, status: string) => status],
  (appointments, status) => 
    appointments.filter(appointment => appointment.status === status)
);

export const selectPendingAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => appointments.filter(appointment => appointment.status === 'Pending')
);

export const selectConfirmedAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => appointments.filter(appointment => appointment.status === 'Confirmed')
);

export const selectCancelledAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => appointments.filter(appointment => appointment.status === 'Cancelled')
);

// Date-based selectors
export const selectTodaysAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= startOfDay && appointmentDate < endOfDay;
    });
  }
);

export const selectThisWeeksAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= startOfWeek && appointmentDate < endOfWeek;
    });
  }
);

// Statistics selectors
export const selectAppointmentsStatistics = createSelector(
  [
    selectAllAppointments,
    selectUserAppointments,
    selectPendingAppointments,
    selectConfirmedAppointments,
    selectCancelledAppointments
  ],
  (allAppointments, userAppointments, pending, confirmed, cancelled) => ({
    total: allAppointments.length,
    userTotal: userAppointments.length,
    pending: pending.length,
    confirmed: confirmed.length,
    cancelled: cancelled.length,
    completionRate: allAppointments.length > 0 
      ? Math.round((confirmed.length / allAppointments.length) * 100) 
      : 0
  })
);

// Filters and pagination
export const selectAppointmentFilters = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.filters
);

export const selectAppointmentPagination = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.pagination
);

// Next appointment selector
export const selectNextAppointment = createSelector(
  [selectUserUpcomingAppointments],
  (upcomingAppointments) => upcomingAppointments[0] || null
);