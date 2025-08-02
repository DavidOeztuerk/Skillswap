// import { createSelector } from '@reduxjs/toolkit';
// import { RootState } from './store';

// /**
//  * Memoized selectors for efficient state access
//  * Using createSelector for performance optimization
//  */

// // Root state selectors
// const selectSkillsState = (state: RootState) => state.skills;
// const selectCategoriesState = (state: RootState) => state.category;
// const selectAppointmentsState = (state: RootState) => state.appointments;
// const selectMatchmakingState = (state: RootState) => state.matchmaking;
// const selectNotificationsState = (state: RootState) => state.notifications;
// const selectAuthState = (state: RootState) => state.auth;
// const selectSearchState = (state: RootState) => state.search;

// /**
//  * Skills Selectors
//  */

// // Basic skills selectors
// export const selectAllSkills = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.allSkills
// );

// export const selectSkillById = createSelector(
//   [selectSkillsState, (_: RootState, skillId: string) => skillId],
//   (skillsState, skillId) => skillsState.allSkills.find(skill => skill.id === skillId) || null
// );

// export const selectSkillsLoading = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.isLoading
// );

// export const selectSkillsError = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.error
// );

// export const selectSelectedSkill = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.selectedSkill
// );

// // User's skills from dedicated state
// export const selectUserSkills = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.userSkills
// );

// // Search results
// export const selectSkillSearchResults = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.searchResults
// );

// // Search query
// export const selectSkillSearchQuery = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.searchQuery
// );

// // Is search active
// export const selectIsSearchActive = createSelector(
//   [selectSkillsState],
//   (skillsState) => skillsState.isSearchActive
// );

// // Skills by category
// export const selectSkillsByCategory = createSelector(
//   [selectAllSkills, (_: RootState, categoryId: string) => categoryId],
//   (skills, categoryId) => 
//     skills.filter(skill => skill.category.id === categoryId)
// );

// // Filtered skills based on search query
// export const selectFilteredSkills = createSelector(
//   [selectAllSkills, selectSkillsState],
//   (skills, skillsState) => {
//     if (!skillsState.searchQuery) return skills;
    
//     const searchQuery = skillsState.searchQuery.toLowerCase();
//     return skills.filter((skill) => 
//       skill.name.toLowerCase().includes(searchQuery) ||
//       skill.description.toLowerCase().includes(searchQuery)
//     );
//   }
// );

// /**
//  * Categories Selectors
//  */

// export const selectAllCategories = createSelector(
//   [selectCategoriesState],
//   (categoriesState) => categoriesState.categories
// );

// export const selectCategoryById = createSelector(
//   [selectCategoriesState, (_: RootState, categoryId: string) => categoryId],
//   (categoriesState, categoryId) => 
//     categoriesState.categories.find(category => category.id === categoryId) || null
// );

// export const selectCategoriesLoading = createSelector(
//   [selectCategoriesState],
//   (categoriesState) => categoriesState.isLoading
// );

// export const selectSelectedCategory = createSelector(
//   [selectCategoriesState],
//   (categoriesState) => categoriesState.selectedCategory
// );

// // Categories with skill counts
// export const selectCategoriesWithSkillCounts = createSelector(
//   [selectAllCategories, selectAllSkills],
//   (categories, skills) => {
//     return categories.map((category) => ({
//       ...category,
//       skillCount: skills.filter((skill) => skill.category.id === category.id).length,
//     }));
//   }
// );

// /**
//  * Appointments Selectors
//  */

// export const selectAllAppointments = createSelector(
//   [selectAppointmentsState],
//   (appointmentsState) => appointmentsState.appointments
// );

// export const selectAppointmentById = createSelector(
//   [selectAppointmentsState, (_: RootState, appointmentId: string) => appointmentId],
//   (appointmentsState, appointmentId) => 
//     appointmentsState.appointments.find(appointment => appointment.id === appointmentId) || null
// );

// export const selectAppointmentsLoading = createSelector(
//   [selectAppointmentsState],
//   (appointmentsState) => appointmentsState.isLoading
// );

// export const selectActiveAppointment = createSelector(
//   [selectAppointmentsState],
//   (appointmentsState) => appointmentsState.activeAppointment || null
// );

// // Upcoming appointments
// export const selectUpcomingAppointments = createSelector(
//   [selectAllAppointments],
//   (appointments) => {
//     const now = new Date();
//     return appointments.filter(appointment => 
//       new Date(appointment.startTime) > now && 
//       appointment.status === 'Confirmed'
//     );
//   }
// );

// // User appointments
// export const selectUserAppointments = createSelector(
//   [selectAllAppointments, selectAuthState],
//   (appointments, authState) => {
//     if (!authState.user?.id) return [];
//     return appointments.filter((appointment) => 
//       appointment.studentId === authState.user?.id || 
//       appointment.teacherId === authState.user?.id
//     );
//   }
// );

// /**
//  * Matches Selectors
//  */

// export const selectAllMatches = createSelector(
//   [selectMatchmakingState],
//   (matchmakingState) => matchmakingState.matches
// );

// export const selectMatchById = createSelector(
//   [selectMatchmakingState, (_: RootState, matchId: string) => matchId],
//   (matchmakingState, matchId) => 
//     matchmakingState.matches.find(match => match.id === matchId) || null
// );

// export const selectMatchesLoading = createSelector(
//   [selectMatchmakingState],
//   (matchmakingState) => matchmakingState.isLoading
// );

// export const selectActiveMatch = createSelector(
//   [selectMatchmakingState],
//   (matchmakingState) => matchmakingState.activeMatch
// );

// // Pending matches for user
// export const selectPendingMatches = createSelector(
//   [selectAllMatches, selectAuthState],
//   (matches, authState) => {
//     if (!authState.user?.id) return [];
//     return matches.filter((match) => 
//       (match.requesterId === authState.user?.id || match.responderId === authState.user?.id) &&
//       match.status === 'pending'
//     );
//   }
// );

// // Match results
// export const selectMatchResults = createSelector(
//   [selectMatchmakingState],
//   (matchmakingState) => matchmakingState.matchResults
// );

// // Incoming requests
// export const selectIncomingRequests = createSelector(
//   [selectMatchmakingState],
//   (matchmakingState) => matchmakingState.incomingRequests
// );

// // Outgoing requests
// export const selectOutgoingRequests = createSelector(
//   [selectMatchmakingState],
//   (matchmakingState) => matchmakingState.outgoingRequests
// );

// /**
//  * Notifications Selectors
//  */

// export const selectAllNotifications = createSelector(
//   [selectNotificationsState],
//   (notificationsState) => notificationsState.notifications
// );

// export const selectNotificationById = createSelector(
//   [selectNotificationsState, (_: RootState, notificationId: string) => notificationId],
//   (notificationsState, notificationId) => 
//     notificationsState.notifications.find(notification => notification.id === notificationId) || null
// );

// export const selectNotificationsLoading = createSelector(
//   [selectNotificationsState],
//   (notificationsState) => notificationsState.isLoading
// );

// export const selectUnreadNotifications = createSelector(
//   [selectAllNotifications],
//   (notifications) => notifications.filter(notification => !notification.isRead)
// );

// export const selectUnreadCount = createSelector(
//   [selectUnreadNotifications],
//   (unreadNotifications) => unreadNotifications.length
// );

// // Recent notifications (last 7 days)
// export const selectRecentNotifications = createSelector(
//   [selectAllNotifications],
//   (notifications) => {
//     const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
//     return notifications.filter(notification => new Date(notification.createdAt).getTime() > sevenDaysAgo);
//   }
// );

// // Unread count from state
// export const selectUnreadNotificationsCount = createSelector(
//   [selectNotificationsState],
//   (notificationsState) => notificationsState.unreadCount
// );

// /**
//  * Search Selectors
//  */

// export const selectSearchResults = createSelector(
//   [selectSearchState],
//   (searchState) => searchState.results
// );

// export const selectSearchLoading = createSelector(
//   [selectSearchState],
//   (searchState) => searchState.isLoading
// );

// export const selectSearchPagination = createSelector(
//   [selectSearchState],
//   (searchState) => searchState.pagination
// );

// export const selectUserSearchResults = createSelector(
//   [selectSearchState],
//   (searchState) => searchState.userResults
// );

// export const selectAllSkillsFromSearch = createSelector(
//   [selectSearchState],
//   (searchState) => searchState.allSkills
// );

// /**
//  * Cross-slice Selectors (combining data from multiple slices)
//  */

// // Dashboard data
// export const selectDashboardData = createSelector(
//   [
//     selectUpcomingAppointments,
//     selectPendingMatches,
//     selectUnreadNotificationsCount,
//     selectUserSkills,
//   ],
//   (upcomingAppointments, pendingMatches, unreadCount, userSkills) => ({
//     upcomingAppointmentsCount: upcomingAppointments.length,
//     pendingMatchesCount: pendingMatches.length,
//     unreadNotificationsCount: unreadCount,
//     userSkillsCount: userSkills.length,
//     nextAppointment: upcomingAppointments[0] || null,
//   })
// );

// // Skill with category info (category is already embedded in skill)
// export const selectSkillWithCategory = createSelector(
//   [(state: RootState, skillId: string) => selectSkillById(state, skillId)],
//   (skill) => skill // Category is already included in the skill object
// );

// // Appointment with participant info
// export const selectAppointmentWithParticipants = createSelector(
//   [
//     (state: RootState, appointmentId: string) => selectAppointmentById(state, appointmentId),
//     selectUserSearchResults, // Use user search results for user info
//   ],
//   (appointment, users) => {
//     if (!appointment) return null;
    
//     const teacher = users.find(user => user.id === appointment.teacherId);
//     const student = users.find(user => user.id === appointment.studentId);
    
//     return {
//       ...appointment,
//       teacher,
//       student,
//     };
//   }
// );

// /**
//  * Performance Analytics Selectors
//  */

// // Memoized statistics
// export const selectSkillsStatistics = createSelector(
//   [selectAllSkills, selectAllCategories],
//   (skills, categories) => ({
//     totalSkills: skills.length,
//     totalCategories: categories.length,
//     averageSkillsPerCategory: skills.length / (categories?.length || 1),
//     topCategories: categories
//       .map((category) => ({
//         ...category,
//         skillCount: skills.filter((skill) => skill.category.id === category.id).length,
//       }))
//       .sort((a, b) => b.skillCount - a.skillCount)
//       .slice(0, 5),
//   })
// );

// // Loading states summary
// export const selectGlobalLoadingState = createSelector(
//   [
//     selectSkillsLoading,
//     selectCategoriesLoading,
//     selectAppointmentsLoading,
//     selectMatchesLoading,
//     selectNotificationsLoading,
//     selectSearchLoading,
//   ],
//   (skillsLoading, categoriesLoading, appointmentsLoading, matchesLoading, notificationsLoading, searchLoading) => ({
//     isAnyLoading: skillsLoading || categoriesLoading || appointmentsLoading || matchesLoading || notificationsLoading || searchLoading,
//     loadingStates: {
//       skills: skillsLoading,
//       categories: categoriesLoading,
//       appointments: appointmentsLoading,
//       matches: matchesLoading,
//       notifications: notificationsLoading,
//       search: searchLoading,
//     },
//   })
// );