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
  fetchAvailableSlots,
  reportAppointment,
  getAppointmentStatistics,
} from '../features/appointments/appointmentsThunks';
import { clearError } from '../features/appointments/appointmentsSlice';
import {
  selectAllAppointments,
  selectUpcomingAppointments,
  selectPastAppointments,
  selectAppointmentsLoading,
  selectAppointmentsError,
  selectUserAppointments,
  selectTodaysAppointments,
  selectNextAppointment
} from '../store/selectors/appointmentsSelectors';

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
export const useAppointments = () => {
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
  const actions = useMemo(() => ({
    
    // === FETCH OPERATIONS ===
    loadAppointments: (params: any = {}) => {
      return dispatch(fetchAppointments(params));
    },

    loadAppointment: (appointmentId: string) => {
      return dispatch(fetchAppointment(appointmentId));
    },

    loadUpcomingAppointments: (params: { limit?: number } = {}) => {
      return dispatch(fetchUpcomingAppointments(params));
    },

    loadPastAppointments: (params: { page?: number; limit?: number } = {}) => {
      return dispatch(fetchPastAppointments(params));
    },

    // === CRUD OPERATIONS ===
    createAppointment: (appointmentData: any) => {
      return dispatch(createAppointment(appointmentData));
    },

    respondToAppointment: (appointmentId: string, status: any) => {
      return dispatch(respondToAppointment({ appointmentId, status }));
    },

    cancelAppointment: (appointmentId: string) => {
      return dispatch(cancelAppointment(appointmentId));
    },

    rescheduleAppointment: (data: {
      appointmentId: string;
      newDateTime: string;
      newDurationMinutes?: number;
      reason?: string;
    }) => {
      return dispatch(rescheduleAppointment(data));
    },

    rateAppointment: (data: {
      appointmentId: string;
      rating: number;
      feedback?: string;
    }) => {
      return dispatch(rateAppointment(data));
    },

    generateMeetingLink: (appointmentId: string) => {
      return dispatch(generateMeetingLink(appointmentId));
    },

    // === ADDITIONAL OPERATIONS ===
    completeAppointment: (appointmentId: string) => {
      return dispatch(completeAppointment(appointmentId));
    },

    updateAppointmentDetails: (appointmentId: string, updates: any) => {
      return dispatch(updateAppointmentDetails({ appointmentId, updates }));
    },

    fetchAvailableSlots: (userId: string, date: string) => {
      return dispatch(fetchAvailableSlots({ userId, date }));
    },

    reportAppointment: (appointmentId: string, reason: string, description: string) => {
      return dispatch(reportAppointment({ appointmentId, reason, description }));
    },

    getAppointmentStatistics: (userId: string) => {
      return dispatch(getAppointmentStatistics(userId));
    },

  }), [dispatch]);

  // ===== DEBUG LOGGING =====
  console.log('🎯 useAppointments: Hook data', {
    appointmentsCount: appointments?.length || 0,
    upcomingAppointmentsCount: upcomingAppointments?.length || 0,
    pastAppointmentsCount: pastAppointments?.length || 0,
    userAppointmentsCount: userAppointments?.length || 0,
    isLoading,
    error,
    appointments: appointments?.slice(0, 2) // Show first 2 for debugging
  });

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

    // === LEGACY COMPATIBILITY ===
    loadAppointments: actions.loadAppointments,
    scheduleAppointment: actions.createAppointment,
    acceptAppointment: (appointmentId: string) => 
      actions.respondToAppointment(appointmentId, 'Confirmed'),
    declineAppointment: (appointmentId: string) => 
      actions.respondToAppointment(appointmentId, 'Cancelled'),
    requestMeetingLink: actions.generateMeetingLink,
    clearError: () => dispatch(clearError()),
    dismissError: () => dispatch(clearError()),
    
    // === PROPERTY COMPATIBILITY ===
    errorMessage: error,
  };
};
