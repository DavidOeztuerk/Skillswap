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
import { selectAuthUser } from '../store/selectors/authSelectors';
import {
  fetchUserMatches,
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
} from '../features/matchmaking/matchmakingThunks';
import { fetchUserSkills } from '../features/skills/thunks/skillsThunks';
import {
  fetchAppointments,
  fetchUpcomingAppointments,
} from '../features/appointments/appointmentsThunks';
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
export const useDashboard = (): {
  // === USER DATA ===
  user: ReturnType<typeof selectAuthUser>;
  // === DASHBOARD DATA (from main selector) ===
  totalSkills: number;
  totalAppointments: number;
  totalMatches: number;
  pendingAppointmentsCount: number;
  pendingMatchesCount: number;
  unreadNotificationsCount: number;
  // === INDIVIDUAL SECTIONS ===
  statistics: ReturnType<typeof selectDashboardStatistics>;
  cards: ReturnType<typeof selectDashboardCards>;
  nextAppointment: ReturnType<typeof selectNextAppointment>;
  teachingSkills: ReturnType<typeof selectTeachingSkillsForDashboard>;
  learningSkills: ReturnType<typeof selectLearningSkillsForDashboard>;
  upcomingAppointments: ReturnType<typeof selectUpcomingAppointmentsForDashboard>;
  // === STATE MANAGEMENT ===
  loadingStates: ReturnType<typeof selectDashboardLoadingStates>;
  errorStates: ReturnType<typeof selectDashboardErrorStates>;
  // === COMPUTED LOADING INDICATORS ===
  isLoading: boolean;
  isLoadingSkills: boolean;
  isLoadingAppointments: boolean;
  isLoadingMatches: boolean;
  isLoadingNotifications: boolean;
  // === COMPUTED ERROR INDICATORS ===
  hasErrors: boolean;
  errors: (string | undefined)[];
  skillsError: string | undefined;
  appointmentsError: string | undefined;
  matchmakingError: string | undefined;
  notificationsError: string | undefined;
  // === COMPUTED DATA AVAILABILITY ===
  hasData: boolean;
  isEmpty: boolean;
  totalItems: number;
  pendingItems: number;
  // === ACTION DISPATCHERS ===
  loadDashboardData: () => void;
  refreshSkills: () => void;
  refreshAppointments: () => void;
  refreshMatches: () => void;
  refreshNotifications: () => void;
  refreshMatchRequests: () => void;
} => {
  const dispatch = useAppDispatch();

  // ===== PRIMARY SELECTOR - COMPLETE DASHBOARD DATA =====
  const dashboardData = useAppSelector(selectDashboardData);
  const user = useAppSelector(selectAuthUser);

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
  const actions = useMemo(
    () => ({
      // === COMPLETE DASHBOARD DATA REFRESH ===
      loadDashboardData: () => {
        // Load all dashboard-relevant data in parallel
        // Using correct user-specific endpoints to prevent 404s
        void dispatch(fetchUserSkills({ pageNumber: 1, pageSize: 12 }));
        void dispatch(fetchAppointments({ pageNumber: 1, pageSize: 12 }));
        void dispatch(fetchUpcomingAppointments({ limit: 12 }));
        void dispatch(fetchUserMatches({ pageNumber: 1, pageSize: 12 }));
        void dispatch(fetchIncomingMatchRequests({ pageNumber: 1, pageSize: 12 }));
        void dispatch(fetchOutgoingMatchRequests({ pageNumber: 1, pageSize: 12 }));
        void dispatch(fetchNotifications({ pageNumber: 1, pageSize: 12 }));
      },

      // === INDIVIDUAL REFRESH ACTIONS ===
      refreshSkills: () => {
        void dispatch(fetchUserSkills({ pageNumber: 1, pageSize: 12 }));
      },

      refreshAppointments: () => {
        // Dashboard needs both all appointments and upcoming appointments
        void dispatch(fetchAppointments({ pageNumber: 1, pageSize: 12 }));
        void dispatch(fetchUpcomingAppointments({ limit: 12 }));
      },

      refreshMatches: () => {
        void dispatch(fetchUserMatches({ pageNumber: 1, pageSize: 12 }));
      },

      refreshNotifications: () => {
        void dispatch(fetchNotifications({ pageNumber: 1, pageSize: 12 }));
      },

      // === COMPOUND REFRESH ACTIONS ===
      refreshMatchRequests: () => {
        void dispatch(fetchIncomingMatchRequests({ pageNumber: 1, pageSize: 12 }));
        void dispatch(fetchOutgoingMatchRequests({ pageNumber: 1, pageSize: 12 }));
      },
    }),
    [dispatch]
  );

  // ===== COMPUTED DASHBOARD STATE (memoized) =====
  const computed = useMemo(
    () => ({
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
      hasData:
        dashboardData.totalSkills > 0 ||
        dashboardData.totalAppointments > 0 ||
        dashboardData.totalMatches > 0,
      isEmpty:
        dashboardData.totalSkills === 0 &&
        dashboardData.totalAppointments === 0 &&
        dashboardData.totalMatches === 0,

      // === DASHBOARD SUMMARY ===
      totalItems:
        dashboardData.totalSkills + dashboardData.totalAppointments + dashboardData.totalMatches,
      pendingItems:
        dashboardData.pendingAppointmentsCount +
        dashboardData.pendingMatchesCount +
        dashboardData.unreadNotificationsCount,
    }),
    [loadingStates, errorStates, dashboardData]
  );

  // ===== HOOK RETURN OBJECT =====
  return {
    // === USER DATA ===
    user,
    // === DASHBOARD DATA (from main selector) ===
    totalSkills: dashboardData.totalSkills,
    totalAppointments: dashboardData.totalAppointments,
    totalMatches: dashboardData.totalMatches,
    pendingAppointmentsCount: dashboardData.pendingAppointmentsCount,
    pendingMatchesCount: dashboardData.pendingMatchesCount,
    unreadNotificationsCount: dashboardData.unreadNotificationsCount,

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
  };
};

export default useDashboard;
