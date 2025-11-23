import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { selectAuthUser } from './authSelectors';
import { appointmentsAdapter } from '../adapters/appointmentsAdapter+State';
import { AppointmentStatus } from '../../types/models/Appointment';

/**
 * APPOINTMENTS SELECTORS - REFACTORED
 *
 * ✅ Uses EntityAdapter selectors for normalized state
 * ✅ No more duplicate arrays (appointments, upcomingAppointments, pastAppointments)
 * ✅ All derived data computed from entities
 * ✅ Efficient memoization with createSelector
 */

// ==================== BASE SELECTORS ====================

export const selectAppointmentsState = (state: RootState) => state.appointments;
export const selectAppointmentsLoading = (state: RootState) => state.appointments.isLoading;
export const selectAppointmentsError = (state: RootState) => state.appointments.errorMessage;
export const selectIsLoadingSlots = (state: RootState) => state.appointments.isLoadingSlots;

// ==================== ENTITY ADAPTER SELECTORS ====================

/**
 * Get adapter selectors scoped to appointments state
 * These provide efficient access to normalized entities
 */
const adapterSelectors = appointmentsAdapter.getSelectors<RootState>(
  (state) => state.appointments
);

// Export adapter selectors
export const {
  selectIds: selectAppointmentIds,
  selectEntities: selectAppointmentEntities,
  selectAll: selectAllAppointments,
  selectTotal: selectAppointmentsTotal,
  selectById: selectAppointmentById,
} = adapterSelectors;

// ==================== DIRECT STATE SELECTORS ====================

export const selectActiveAppointment = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.activeAppointment
);

export const selectAvailableSlots = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.availableSlots
);

export const selectAppointmentFilters = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.filters
);

export const selectAppointmentPagination = createSelector(
  [selectAppointmentsState],
  (appointmentsState) => appointmentsState.pagination
);

// ==================== COMPUTED SELECTORS (FROM ENTITIES) ====================

/**
 * Select upcoming appointments (future & confirmed)
 * REPLACES: state.upcomingAppointments
 */
export const selectUpcomingAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => {
    const now = new Date();
    return appointments
      .filter(appointment =>
        new Date(appointment.startTime) > now &&
        ([AppointmentStatus.Accepted, AppointmentStatus.Pending].includes(appointment.status))
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
);

/**
 * Select past appointments (past or completed)
 * REPLACES: state.pastAppointments
 */
export const selectPastAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => {
    const now = new Date();
    return appointments
      .filter(appointment =>
        new Date(appointment.startTime) <= now ||
        appointment.status === AppointmentStatus.Completed ||
        appointment.status === AppointmentStatus.Cancelled
      )
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
);

// ==================== USER-SPECIFIC SELECTORS ====================

/**
 * Select all appointments for current user
 */
export const selectUserAppointments = createSelector(
  [selectAllAppointments, selectAuthUser],
  (appointments, user) => {
    if (!user?.id) {
      return [];
    }

    return appointments.filter(appointment =>
      appointment.organizerUserId === user.id || appointment.participantUserId === user.id
    );
  }
);

/**
 * Select upcoming appointments for current user
 */
export const selectUserUpcomingAppointments = createSelector(
  [selectUpcomingAppointments, selectAuthUser],
  (upcomingAppointments, user) => {
    if (!user?.id) return [];
    return upcomingAppointments.filter(appointment =>
      appointment.organizerUserId === user.id ||
      appointment.participantUserId === user.id
    );
  }
);

/**
 * Select past appointments for current user
 */
export const selectUserPastAppointments = createSelector(
  [selectPastAppointments, selectAuthUser],
  (pastAppointments, user) => {
    if (!user?.id) return [];
    return pastAppointments.filter(appointment =>
      appointment.organizerUserId === user.id ||
      appointment.participantUserId === user.id
    );
  }
);

/**
 * Select appointments where user is teaching (organizer)
 */
export const selectTeachingAppointments = createSelector(
  [selectUserAppointments, selectAuthUser],
  (userAppointments, user) => {
    if (!user?.id) return [];
    return userAppointments.filter(appointment =>
      appointment.organizerUserId === user.id
    );
  }
);

/**
 * Select appointments where user is learning (participant)
 */
export const selectLearningAppointments = createSelector(
  [selectUserAppointments, selectAuthUser],
  (userAppointments, user) => {
    if (!user?.id) return [];
    return userAppointments.filter(appointment =>
      appointment.participantUserId === user.id
    );
  }
);

// ==================== STATUS-BASED SELECTORS ====================

/**
 * Select appointments by status
 */
export const selectAppointmentsByStatus = createSelector(
  [selectAllAppointments, (_: RootState, status: string) => status],
  (appointments, status) =>
    appointments.filter(appointment => appointment.status === status)
);

export const selectPendingAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => appointments.filter(appointment => appointment.status === AppointmentStatus.Pending)
);

export const selectAcceptedAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => appointments.filter(appointment => appointment.status === AppointmentStatus.Accepted)
);

export const selectCancelledAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => appointments.filter(appointment => appointment.status === AppointmentStatus.Cancelled)
);

export const selectCompletedAppointments = createSelector(
  [selectAllAppointments],
  (appointments) => appointments.filter(appointment => appointment.status === AppointmentStatus.Completed)
);

// ==================== DATE-BASED SELECTORS ====================

/**
 * Select today's appointments
 */
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

/**
 * Select this week's appointments
 */
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

/**
 * Select appointments by date range
 */
export const selectAppointmentsByDateRange = createSelector(
  [
    selectAllAppointments,
    (_: RootState, startDate: Date) => startDate,
    (_: RootState, __: Date, endDate: Date) => endDate,
  ],
  (appointments, startDate, endDate) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }
);

// ==================== STATISTICS SELECTORS ====================

/**
 * Select appointment statistics
 */
export const selectAppointmentsStatistics = createSelector(
  [
    selectAllAppointments,
    selectUserAppointments,
    selectPendingAppointments,
    selectCompletedAppointments,
    selectCancelledAppointments,
  ],
  (allAppointments, userAppointments, pending, completed, cancelled) => ({
    total: allAppointments.length,
    userTotal: userAppointments.length,
    pending: pending.length,
    completed: completed.length,
    cancelled: cancelled.length,
    completionRate: allAppointments.length > 0
      ? Math.round((completed.length / allAppointments.length) * 100)
      : 0,
  })
);

// ==================== UTILITY SELECTORS ====================

/**
 * Select next appointment (earliest upcoming)
 */
export const selectNextAppointment = createSelector(
  [selectUserUpcomingAppointments],
  (upcomingAppointments) => upcomingAppointments[0] || null
);

/**
 * Select appointment count by user role
 */
export const selectAppointmentCountByRole = createSelector(
  [selectTeachingAppointments, selectLearningAppointments],
  (teaching, learning) => ({
    teaching: teaching.length,
    learning: learning.length,
  })
);

/**
 * Check if user has any upcoming appointments
 */
export const selectHasUpcomingAppointments = createSelector(
  [selectUserUpcomingAppointments],
  (upcomingAppointments) => upcomingAppointments.length > 0
);

/**
 * Select appointments that need action (pending & user is participant)
 */
export const selectAppointmentsNeedingAction = createSelector(
  [selectPendingAppointments, selectAuthUser],
  (pendingAppointments, user) => {
    if (!user?.id) return [];
    return pendingAppointments.filter(appointment =>
      appointment.participantUserId === user.id
    );
  }
);
