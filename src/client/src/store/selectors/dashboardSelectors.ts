import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { selectUserUpcomingAppointments, selectUserAppointments, selectPendingAppointments } from './appointmentsSelectors';
import { selectUserSkills, selectOfferedSkills } from './skillsSelectors';
import { selectPendingMatches, selectUserMatches, selectUnreadIncomingRequests } from './matchmakingSelectors';
import { selectUnreadCount } from './notificationsSelectors';
import { selectAuthUser } from './authSelectors';

/**
 * Dashboard Selectors
 * Centralized selectors for dashboard-specific data aggregation and statistics
 */

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
  (userSkills, offeredSkills, userAppointments, pendingAppointments, userMatches, pendingMatches, unreadCount) => ({
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
  (upcomingAppointments) => upcomingAppointments[0] || null
);

// Dashboard cards data
export const selectDashboardCards = createSelector(
  [
    selectDashboardStatistics,
    selectUnreadIncomingRequests,
  ],
  (stats, unreadRequests) => [
    {
      title: 'Skills',
      description: `${stats.totalSkills} Skills • ${stats.teachingSkillsCount} zum Lehren`,
      count: stats.totalSkills,
      path: '/skills',
      color: '#4caf50',
    },
    {
      title: 'Matches',
      description: `${stats.totalMatches} active matches${stats.pendingMatchesCount > 0 ? ` • ${stats.pendingMatchesCount} new requests` : ''}`,
      count: stats.totalMatches,
      badge: stats.pendingMatchesCount + unreadRequests.length,
      path: '/matchmaking',
      color: '#ff9800',
    },
    {
      title: 'Termine',
      description: `${stats.totalAppointments} ${stats.totalAppointments === 1 ? 'Termin' : 'Termine'}${stats.pendingAppointmentsCount > 0 ? ` • ${stats.pendingAppointmentsCount} ausstehend` : ''}`,
      count: stats.totalAppointments,
      badge: stats.pendingAppointmentsCount,
      path: '/appointments',
      color: '#e91e63',
    },
    {
      title: 'Benachrichtigungen',
      description: `Notifications${stats.unreadNotificationsCount > 0 ? ` • ${stats.unreadNotificationsCount} unread` : ''}`,
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
export const selectLearningSkillsForDashboard = createSelector(
  [selectUserSkills],
  (userSkills) => {
    // Skills the user wants to learn (not offered)
    const learningSkills = userSkills.filter(skill => !skill.isOffered);
    return learningSkills.slice(0, 5);
  }
);

// Upcoming appointments for dashboard display
export const selectUpcomingAppointmentsForDashboard = createSelector(
  [selectUserUpcomingAppointments],
  (upcomingAppointments) => {
    console.log('🎯 selectUpcomingAppointmentsForDashboard: Processing appointments', {
      upcomingAppointments,
      appointmentsCount: upcomingAppointments?.length || 0,
      firstAppointment: upcomingAppointments?.[0]
    });

    const now = new Date();
    const filtered = upcomingAppointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.startTime);
        const isFuture = appointmentDate > now;
        const isRelevantStatus = ['Pending', 'Confirmed', 'Accepted'].includes(appointment.status);

        console.log('🔍 Dashboard filter check:', {
          appointmentId: appointment.id,
          startTime: appointment.startTime,
          status: appointment.status,
          isFuture,
          isRelevantStatus,
          willInclude: isFuture && isRelevantStatus
        });

        return isFuture && isRelevantStatus;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3);

    console.log('✅ selectUpcomingAppointmentsForDashboard: Filtered result', {
      originalCount: upcomingAppointments?.length || 0,
      filteredCount: filtered.length,
      filtered
    });

    return filtered;
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
  (statistics, cards, nextAppointment, teachingSkills, learningSkills, upcomingAppointments, user) => ({
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
    isAnyLoading: skillsLoading || appointmentsLoading || matchmakingLoading || notificationsLoading,
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
    const errors = [skillsError, appointmentsError, matchmakingError, notificationsError].filter(Boolean);
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