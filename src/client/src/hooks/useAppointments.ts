import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  fetchAppointments,
  fetchAppointment,
  createAppointment,
  respondToAppointment,
  cancelAppointment,
  rescheduleAppointment,
  rateAppointment,
  generateMeetingLink,
  fetchUpcomingAppointments,
  fetchPastAppointments,
  completeAppointment,
  updateAppointmentDetails,
  //fetchAvailableSlots,
  reportAppointment,
  getAppointmentStatistics,
} from '../features/appointments/appointmentsThunks';
import {
  selectAllAppointments,
  selectUpcomingAppointments,
  selectPastAppointments,
  selectAppointmentsLoading,
  selectAppointmentsError,
  selectUserAppointments,
  selectTodaysAppointments,
  selectNextAppointment,
} from '../store/selectors/appointmentsSelectors';
import type { GetUserAppointmentsRequest } from '../api/services/appointmentService';
import type { AppointmentRequest } from '../types/contracts/requests/AppointmentRequest';
import type { Appointment, AppointmentStatus } from '../types/models/Appointment';

/**
 * 🚀 ROBUSTE USEAPPOINTMENTS HOOK
 *
 * ✅ KEINE useEffects - prevents infinite loops!
 * ✅ Stateless Design - nur Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 *
 * CRITICAL: This hook is STATELESS and contains NO useEffects.
 * All data fetching must be initiated from Components!
 */
export const useAppointments = (): {
  // === STATE DATA ===
  appointments: Appointment[];
  userAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  todaysAppointments: Appointment[];
  nextAppointment: Appointment | undefined;
  isLoading: boolean;
  error: string | undefined;
  // === FETCH OPERATIONS ===
  loadAppointments: (params?: GetUserAppointmentsRequest) => void;
  loadAppointment: (appointmentId: string) => void;
  loadUpcomingAppointments: (params?: { limit?: number }) => void;
  loadPastAppointments: (params?: { page?: number; limit?: number }) => void;
  // === CRUD OPERATIONS ===
  createAppointment: (appointmentData: AppointmentRequest) => void;
  respondToAppointment: (appointmentId: string, status: AppointmentStatus) => void;
  cancelAppointment: (appointmentId: string) => void;
  rescheduleAppointment: (data: {
    appointmentId: string;
    newDateTime: string;
    newDurationMinutes?: number;
    reason?: string;
  }) => void;
  rateAppointment: (data: { appointmentId: string; rating: number; feedback?: string }) => void;
  generateMeetingLink: (appointmentId: string) => void;
  // === ADDITIONAL OPERATIONS ===
  completeAppointment: (appointmentId: string) => void;
  updateAppointmentDetails: (appointmentId: string, updates: Partial<Appointment>) => void;
  reportAppointment: (appointmentId: string, reason: string, description: string) => void;
  getAppointmentStatistics: (userId: string) => void;
} => {
  const dispatch = useAppDispatch();

  // ===== SELECTORS =====
  const appointments = useAppSelector(selectAllAppointments);
  const upcomingAppointments = useAppSelector(selectUpcomingAppointments);
  const pastAppointments = useAppSelector(selectPastAppointments);
  const userAppointments = useAppSelector(selectUserAppointments);
  const todaysAppointments = useAppSelector(selectTodaysAppointments);
  const nextAppointment = useAppSelector(selectNextAppointment);
  const isLoading = useAppSelector(selectAppointmentsLoading);
  const error = useAppSelector(selectAppointmentsError);

  // ===== MEMOIZED ACTIONS =====
  const actions = useMemo(
    () => ({
      // === FETCH OPERATIONS ===
      loadAppointments: (params: GetUserAppointmentsRequest = {}) =>
        dispatch(fetchAppointments(params)),

      loadAppointment: (appointmentId: string) => dispatch(fetchAppointment(appointmentId)),

      loadUpcomingAppointments: (params: { limit?: number } = {}) =>
        dispatch(fetchUpcomingAppointments(params)),

      loadPastAppointments: (params: { page?: number; limit?: number } = {}) =>
        dispatch(fetchPastAppointments(params)),

      // === CRUD OPERATIONS ===
      createAppointment: (appointmentData: AppointmentRequest) =>
        dispatch(createAppointment(appointmentData)),

      respondToAppointment: (appointmentId: string, status: AppointmentStatus) =>
        dispatch(respondToAppointment({ appointmentId, status })),

      cancelAppointment: (appointmentId: string) => dispatch(cancelAppointment(appointmentId)),

      rescheduleAppointment: (data: {
        appointmentId: string;
        newDateTime: string;
        newDurationMinutes?: number;
        reason?: string;
      }) => dispatch(rescheduleAppointment(data)),

      rateAppointment: (data: { appointmentId: string; rating: number; feedback?: string }) =>
        dispatch(rateAppointment(data)),

      generateMeetingLink: (appointmentId: string) => dispatch(generateMeetingLink(appointmentId)),

      // === ADDITIONAL OPERATIONS ===
      completeAppointment: (appointmentId: string) => dispatch(completeAppointment(appointmentId)),

      updateAppointmentDetails: (appointmentId: string, updates: Partial<Appointment>) =>
        dispatch(updateAppointmentDetails({ appointmentId, updates })),

      // TODO: muss noch implementiert werden
      // fetchAvailableSlots: (userId: string, date: string) => dispatch(fetchAvailableSlots({ userId, date })),

      reportAppointment: (appointmentId: string, reason: string, description: string) =>
        dispatch(reportAppointment({ appointmentId, reason, description })),

      getAppointmentStatistics: (userId: string) => dispatch(getAppointmentStatistics(userId)),
    }),
    [dispatch]
  );

  // ===== RETURN OBJECT =====
  return {
    // === STATE DATA ===
    appointments,
    userAppointments,
    upcomingAppointments,
    pastAppointments,
    todaysAppointments,
    nextAppointment,

    // === LOADING STATES ===
    isLoading,

    // === ERROR STATES ===
    error,

    // === ACTIONS ===
    ...actions,
  };
};
