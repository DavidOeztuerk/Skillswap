/**
 * Dashboard Selectors
 * Centralized selectors for dashboard-specific data aggregation and statistics
 */

import { createSelector } from '@reduxjs/toolkit';
import {
  selectUserAppointments,
  selectPendingAppointments,
  selectUserUpcomingAppointments,
} from '../../appointments/store/appointmentsSelectors';
import { AppointmentStatus } from '../../appointments/types/Appointment';
import { selectAuthUser } from '../../auth/store/authSelectors';
import {
  selectUserMatches,
  selectPendingMatches,
  selectUnreadIncomingRequests,
} from '../../matchmaking/store/matchmakingSelectors';
import { selectUnreadCount } from '../../notifications/store/notificationsSelectors';
import { selectUserSkills, selectOfferedSkills } from '../../skills/store/skillsSelectors';
import type { RootState } from '../../../core/store/store';

// Base dashboard statistics
export const selectDashboardStatistics = createSelector(
  [
    selectUserSkills,
    selectOfferedSkills,
    selectUserAppointments,
    selectPendingAppointments,
    selectUserMatches,
    selectPendingMatches,
    selectUnreadCount,
  ],
  (
    userSkills,
    offeredSkills,
    userAppointments,
    pendingAppointments,
    userMatches,
    pendingMatches,
    unreadCount
  ) => ({
    // Skills statistics
    totalSkills: userSkills.length,
    teachingSkillsCount: offeredSkills.length,

    // Appointments statistics
    totalAppointments: userAppointments.length,
    pendingAppointmentsCount: pendingAppointments.length,

    // Matching statistics
    totalMatches: userMatches.length,
    pendingMatchesCount: pendingMatches.length,

    // Notifications
    unreadNotificationsCount: unreadCount,
  })
);

// Next upcoming appointment
export const selectNextAppointment = createSelector(
  [selectUserUpcomingAppointments],
  (upcomingAppointments) => upcomingAppointments[0]
);

// Helper to build description strings without nested template literals
function buildMatchesDescription(totalMatches: number, pendingCount: number): string {
  const countStr = totalMatches.toString();
  const pendingStr = pendingCount.toString();
  if (pendingCount > 0) {
    return `${countStr} active matches • ${pendingStr} new requests`;
  }
  return `${countStr} active matches`;
}

function buildAppointmentsDescription(total: number, pendingCount: number): string {
  const countStr = total.toString();
  const termLabel = total === 1 ? 'Termin' : 'Termine';
  const pendingStr = pendingCount.toString();
  if (pendingCount > 0) {
    return `${countStr} ${termLabel} • ${pendingStr} ausstehend`;
  }
  return `${countStr} ${termLabel}`;
}

function buildNotificationsDescription(unreadCount: number): string {
  if (unreadCount > 0) {
    return `Notifications • ${unreadCount.toString()} unread`;
  }
  return 'Notifications';
}

// Dashboard cards data
export const selectDashboardCards = createSelector(
  [selectDashboardStatistics, selectUnreadIncomingRequests],
  (stats, unreadRequests) => [
    {
      title: 'Skills',
      description: `${stats.totalSkills.toString()} Skills • ${stats.teachingSkillsCount.toString()} zum Lehren`,
      count: stats.totalSkills,
      path: '/skills',
      color: '#4caf50',
    },
    {
      title: 'Matches',
      description: buildMatchesDescription(stats.totalMatches, stats.pendingMatchesCount),
      count: stats.totalMatches,
      badge: stats.pendingMatchesCount + unreadRequests.length,
      path: '/matchmaking',
      color: '#ff9800',
    },
    {
      title: 'Termine',
      description: buildAppointmentsDescription(
        stats.totalAppointments,
        stats.pendingAppointmentsCount
      ),
      count: stats.totalAppointments,
      badge: stats.pendingAppointmentsCount,
      path: '/appointments',
      color: '#e91e63',
    },
    {
      title: 'Benachrichtigungen',
      description: buildNotificationsDescription(stats.unreadNotificationsCount),
      count: stats.unreadNotificationsCount,
      badge: stats.unreadNotificationsCount,
      path: '/notifications',
      color: '#3f51b5',
    },
  ]
);

// Teaching skills for sidebar display
export const selectTeachingSkillsForDashboard = createSelector(
  [selectOfferedSkills],
  (offeredSkills) => offeredSkills.slice(0, 5)
);

// Learning skills for sidebar display
export const selectLearningSkillsForDashboard = createSelector([selectUserSkills], (userSkills) => {
  // Skills the user wants to learn (not offered)
  const learningSkills = userSkills.filter((skill) => !skill.isOffered);
  return learningSkills.slice(0, 5);
});

// Upcoming appointments for dashboard display
export const selectUpcomingAppointmentsForDashboard = createSelector(
  [selectUserUpcomingAppointments],
  (upcomingAppointments) => {
    const now = new Date();
    return upcomingAppointments
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.startTime);
        const isFuture = appointmentDate > now;
        const isRelevantStatus = [AppointmentStatus.Pending, AppointmentStatus.Confirmed].includes(
          appointment.status
        );
        return isFuture && isRelevantStatus;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3);
  }
);

// Comprehensive dashboard data selector
export const selectDashboardData = createSelector(
  [
    selectDashboardStatistics,
    selectDashboardCards,
    selectNextAppointment,
    selectTeachingSkillsForDashboard,
    selectLearningSkillsForDashboard,
    selectUpcomingAppointmentsForDashboard,
    selectAuthUser,
  ],
  (
    statistics,
    cards,
    nextAppointment,
    teachingSkills,
    learningSkills,
    upcomingAppointments,
    user
  ) => ({
    // User info
    user,

    // Statistics
    ...statistics,

    // Dashboard cards
    cards,

    // Detailed data for sections
    nextAppointment,
    teachingSkills,
    learningSkills,
    upcomingAppointments,

    // Computed flags
    hasUpcomingAppointments: upcomingAppointments.length > 0,
    hasTeachingSkills: teachingSkills.length > 0,
    hasLearningSkills: learningSkills.length > 0,
    hasNotifications: statistics.unreadNotificationsCount > 0,
  })
);

// Loading states summary for dashboard
export const selectDashboardLoadingStates = createSelector(
  [
    (state: RootState) => state.skills.isLoading,
    (state: RootState) => state.appointments.isLoading,
    (state: RootState) => state.matchmaking.isLoading,
    (state: RootState) => state.notifications.isLoading,
  ],
  (skillsLoading, appointmentsLoading, matchmakingLoading, notificationsLoading) => ({
    isAnyLoading:
      skillsLoading || appointmentsLoading || matchmakingLoading || notificationsLoading,
    skillsLoading,
    appointmentsLoading,
    matchmakingLoading,
    notificationsLoading,
  })
);

// Error states summary for dashboard
export const selectDashboardErrorStates = createSelector(
  [
    (state: RootState) => state.skills.errorMessage,
    (state: RootState) => state.appointments.errorMessage,
    (state: RootState) => state.matchmaking.errorMessage,
    (state: RootState) => state.notifications.errorMessage,
  ],
  (skillsError, appointmentsError, matchmakingError, notificationsError) => {
    const errors = [skillsError, appointmentsError, matchmakingError, notificationsError].filter(
      Boolean
    );
    return {
      hasErrors: errors.length > 0,
      errors,
      skillsError,
      appointmentsError,
      matchmakingError,
      notificationsError,
    };
  }
);
