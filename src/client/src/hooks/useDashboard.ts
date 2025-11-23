import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  selectDashboardData,
  selectDashboardStatistics,
  selectDashboardCards,
  selectNextAppointment,
  selectTeachingSkillsForDashboard,
  selectLearningSkillsForDashboard,
  selectUpcomingAppointmentsForDashboard,
  selectDashboardLoadingStates,
  selectDashboardErrorStates,
} from '../store/selectors/dashboardSelectors';
import { fetchUserMatches, fetchIncomingMatchRequests, fetchOutgoingMatchRequests } from '../features/matchmaking/matchmakingThunks';
import { fetchUserSkills } from '../features/skills/thunks/skillsThunks';
import { fetchAppointments, fetchUpcomingAppointments } from '../features/appointments/appointmentsThunks';
import { fetchNotifications } from '../features/notifications/notificationThunks';

/**
 * 🚀 SELECTOR-BASED DASHBOARD HOOK
 * 
 * ✅ Selector-First Approach - uses dashboardSelectors for data
 * ✅ NO useEffects - prevents infinite loops!
 * ✅ Stateless Design - only Redux State + Action dispatchers
 * ✅ Memoized Actions - prevents unnecessary re-renders
 * ✅ Centralized Dashboard Logic via Selectors
 * 
 * ARCHITECTURE: This hook primarily uses selectors and only provides
 * action dispatchers. Components should trigger data loading.
 */
export const useDashboard = () => {
  const dispatch = useAppDispatch();

  // ===== PRIMARY SELECTOR - COMPLETE DASHBOARD DATA =====
  const dashboardData = useAppSelector(selectDashboardData);
  
  // ===== INDIVIDUAL SELECTORS (for specific use cases) =====
  const statistics = useAppSelector(selectDashboardStatistics);
  const cards = useAppSelector(selectDashboardCards);
  const nextAppointment = useAppSelector(selectNextAppointment);
  const teachingSkills = useAppSelector(selectTeachingSkillsForDashboard);
  const learningSkills = useAppSelector(selectLearningSkillsForDashboard);
  const upcomingAppointments = useAppSelector(selectUpcomingAppointmentsForDashboard);
  const loadingStates = useAppSelector(selectDashboardLoadingStates);
  const errorStates = useAppSelector(selectDashboardErrorStates);

  // ===== MEMOIZED ACTION DISPATCHERS =====
  const actions = useMemo(() => ({
    
    // === COMPLETE DASHBOARD DATA REFRESH ===
    loadDashboardData: async () => {
      // Load all dashboard-relevant data in parallel
      // ✅ Using correct user-specific endpoints to prevent 404s
      const promises = [
        dispatch(fetchUserSkills({ pageNumber: 1, pageSize: 12 })),
        dispatch(fetchAppointments({ pageNumber: 1, pageSize: 12 })),
        dispatch(fetchUpcomingAppointments({ limit: 12 })), // ⭐ FIX: Dashboard braucht upcoming appointments
        dispatch(fetchUserMatches({ pageNumber: 1, pageSize: 12 })),
        dispatch(fetchIncomingMatchRequests({ pageNumber: 1, pageSize: 12 })),
        dispatch(fetchOutgoingMatchRequests({ pageNumber: 1, pageSize: 12 })),
        dispatch(fetchNotifications({ pageNumber: 1, pageSize: 12 })),
      ];
      
      return Promise.allSettled(promises);
    },

    // === INDIVIDUAL REFRESH ACTIONS ===
    refreshSkills: () => dispatch(fetchUserSkills({ pageNumber: 1, pageSize: 12 })),
    refreshAppointments: () => {
      // Dashboard needs both all appointments and upcoming appointments
      dispatch(fetchAppointments({ pageNumber: 1, pageSize: 12 }));
      return dispatch(fetchUpcomingAppointments({ limit: 12 }));
    },
    refreshMatches: () => dispatch(fetchUserMatches({ pageNumber: 1, pageSize: 12 })),
    refreshNotifications: () => dispatch(fetchNotifications({ pageNumber: 1, pageSize: 12 })),
    
    // === COMPOUND REFRESH ACTIONS ===
    refreshMatchRequests: async () => {
      const promises = [
        dispatch(fetchIncomingMatchRequests({ pageNumber: 1, pageSize: 12 })),
        dispatch(fetchOutgoingMatchRequests({ pageNumber: 1, pageSize: 12 })),
      ];
      return Promise.allSettled(promises);
    },

  }), [dispatch]);

  // ===== COMPUTED DASHBOARD STATE (memoized) =====
  const computed = useMemo(() => ({
    
    // === LOADING INDICATORS ===
    isLoading: loadingStates.isAnyLoading,
    isLoadingSkills: loadingStates.skillsLoading,
    isLoadingAppointments: loadingStates.appointmentsLoading,
    isLoadingMatches: loadingStates.matchmakingLoading,
    isLoadingNotifications: loadingStates.notificationsLoading,

    // === ERROR INDICATORS ===
    hasErrors: errorStates.hasErrors,
    errors: errorStates.errors,
    skillsError: errorStates.skillsError,
    appointmentsError: errorStates.appointmentsError,
    matchmakingError: errorStates.matchmakingError,
    notificationsError: errorStates.notificationsError,

    // === DATA AVAILABILITY ===
    hasData: dashboardData.totalSkills > 0 || dashboardData.totalAppointments > 0 || dashboardData.totalMatches > 0,
    isEmpty: dashboardData.totalSkills === 0 && dashboardData.totalAppointments === 0 && dashboardData.totalMatches === 0,

    // === DASHBOARD SUMMARY ===
    totalItems: dashboardData.totalSkills + dashboardData.totalAppointments + dashboardData.totalMatches,
    pendingItems: dashboardData.pendingAppointmentsCount + dashboardData.pendingMatchesCount + dashboardData.unreadNotificationsCount,
    
  }), [loadingStates, errorStates, dashboardData]);

  // ===== HOOK RETURN OBJECT =====
  return {
    // === COMPLETE DASHBOARD DATA (from main selector) ===
    ...dashboardData,

    // === INDIVIDUAL SECTIONS (for specific components) ===
    statistics,
    cards,
    nextAppointment,
    teachingSkills,
    learningSkills,
    upcomingAppointments,

    // === STATE MANAGEMENT ===
    loadingStates,
    errorStates,
    
    // === COMPUTED VALUES ===
    ...computed,

    // === ACTION DISPATCHERS ===
    ...actions,

    // === LEGACY API COMPATIBILITY ===
    data: dashboardData,
    isLoading: computed.isLoading,
    error: errorStates.hasErrors ? errorStates.errors[0] : null,
    loadData: actions.loadDashboardData,
  };
};

export default useDashboard;
