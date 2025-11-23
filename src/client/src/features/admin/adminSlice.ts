import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AdminUser,
  AdminSkill,
  ModerationReport,
} from '../../types/models/Admin';
import { withDefault, isDefined } from '../../utils/safeAccess';
import { initialAdminState } from '../../store/adapters/adminAdapter+State';
import { fetchAdminDashboard, fetchAdminUsers, updateUserRole, suspendUser, unsuspendUser, deleteUser, fetchAdminSkills, moderateSkill, fetchAdminAppointments, fetchAdminMatches, fetchAdminAnalytics, fetchSystemHealth, fetchAuditLogs, fetchModerationReports, handleModerationReport, fetchAdminSettings, updateAdminSettings } from './adminThunks';

const adminSlice = createSlice({
  name: 'admin',
  initialState: initialAdminState,
  reducers: {
    clearError: (state) => {
      state.errorMessage = undefined;
    },
    clearUserError: (state) => {
      state.userError = undefined;
    },
    clearSkillError: (state) => {
      state.skillError = undefined;
    },
    clearAppointmentError: (state) => {
      state.appointmentError = undefined;
    },
    clearMatchError: (state) => {
      state.matchError = undefined;
    },
    clearAnalyticsError: (state) => {
      state.analyticsError = undefined;
    },
    clearSystemHealthError: (state) => {
      state.systemHealthError = undefined;
    },
    clearAuditLogError: (state) => {
      state.auditLogError = undefined;
    },
    clearReportError: (state) => {
      state.reportError = undefined;
    },
    clearSettingsError: (state) => {
      state.settingsError = undefined;
    },
    setUserFilters: (state, action: PayloadAction<any>) => {
      state.filters.users = { ...state.filters.users, ...action.payload };
    },
    setSkillFilters: (state, action: PayloadAction<any>) => {
      state.filters.skills = { ...state.filters.skills, ...action.payload };
    },
    setAppointmentFilters: (state, action: PayloadAction<any>) => {
      state.filters.appointments = { ...state.filters.appointments, ...action.payload };
    },
    setMatchFilters: (state, action: PayloadAction<any>) => {
      state.filters.matches = { ...state.filters.matches, ...action.payload };
    },
    setAuditLogFilters: (state, action: PayloadAction<any>) => {
      state.filters.auditLogs = { ...state.filters.auditLogs, ...action.payload };
    },
    setReportFilters: (state, action: PayloadAction<any>) => {
      state.filters.reports = { ...state.filters.reports, ...action.payload };
    },
    
    setUserPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      state.pagination.users = { ...state.pagination.users, ...action.payload };
    },
    setSkillPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      state.pagination.skills = { ...state.pagination.skills, ...action.payload };
    },
    setAppointmentPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      state.pagination.appointments = { ...state.pagination.appointments, ...action.payload };
    },
    setMatchPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      state.pagination.matches = { ...state.pagination.matches, ...action.payload };
    },
    setAuditLogPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      state.pagination.auditLogs = { ...state.pagination.auditLogs, ...action.payload };
    },
    setReportPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      state.pagination.reports = { ...state.pagination.reports, ...action.payload };
    },
    
    updateUserInList: (state, action: PayloadAction<AdminUser>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    
    removeUserFromList: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    
    updateSkillInList: (state, action: PayloadAction<AdminSkill>) => {
      const index = state.skills.findIndex(skill => skill.id === action.payload.id);
      if (index !== -1) {
        state.skills[index] = action.payload;
      }
    },
    
    updateReportInList: (state, action: PayloadAction<ModerationReport>) => {
      const index = state.moderationReports.findIndex(report => report.id === action.payload.id);
      if (index !== -1) {
        state.moderationReports[index] = action.payload;
      }
    },
    
    // Optimistic updates
    updateUserRoleOptimistic: (state, action: PayloadAction<{ userId: string; role: string }>) => {
      const user = state.users.find(u => u.id === action.payload.userId);
      if (user) {
        user.roles.push(action.payload.role);
      }
    },
    
    suspendUserOptimistic: (state, action: PayloadAction<string>) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) {
        user.accountStatus = 'suspended';
      }
    },
    
    unsuspendUserOptimistic: (state, action: PayloadAction<string>) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) {
        user.accountStatus = 'active';
      }
    },
    
    deleteUserOptimistic: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    
    moderateSkillOptimistic: (state, action: PayloadAction<{ skillId: string; action: 'approve' | 'reject' | 'quarantine' }>) => {
      const skill = state.skills.find(s => s.id === action.payload.skillId);
      if (skill) {
        skill.status = action.payload.action === 'approve' ? 'approved' : 
                      action.payload.action === 'reject' ? 'rejected' : 'quarantined';
      }
    },
    
    handleReportOptimistic: (state, action: PayloadAction<{ reportId: string; action: 'approve' | 'reject' | 'escalate' }>) => {
      const report = state.moderationReports.find(r => r.id === action.payload.reportId);
      if (report) {
        report.status = action.payload.action === 'approve' ? 'approved' : 
                       action.payload.action === 'reject' ? 'rejected' : 'escalated';
      }
    },
    
    // Rollback actions
    setUsers: (state, action: PayloadAction<AdminUser[]>) => {
      state.users = action.payload;
    },
    
    setSkills: (state, action: PayloadAction<AdminSkill[]>) => {
      state.skills = action.payload;
    },
    
    setModerationReports: (state, action: PayloadAction<ModerationReport[]>) => {
      state.moderationReports = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload.data;
        state.errorMessage = undefined;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isLoadingUsers = true;
        state.userError = undefined;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isLoadingUsers = false;
        if (isDefined(action.payload.data)) {
          state.users = action.payload.data;
          state.pagination.users.total = withDefault(action.payload.totalRecords, action.payload.data?.length || 0);
        }
        state.userError = undefined;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isLoadingUsers = false;
        state.userError = action.payload?.message;
      })
      
      .addCase(updateUserRole.fulfilled, (state, action) => {
        if (isDefined(action.payload.data)) {
          const index = state.users.findIndex(user => user.id === action.payload.data.id);
          if (index !== -1) {
            state.users[index] = action.payload.data;
          }
        }
      })
      
      .addCase(suspendUser.fulfilled, (state, action) => {
        if (isDefined(action.payload.data)) {
          const index = state.users.findIndex(user => user.id === action.payload.data.id);
          if (index !== -1) {
            state.users[index] = action.payload.data;
          }
        }
      })
      
      .addCase(unsuspendUser.fulfilled, (state, action) => {
        if (isDefined(action.payload.data)) {
          const index = state.users.findIndex(user => user.id === action.payload.data.id);
          if (index !== -1) {
            state.users[index] = action.payload.data;
          }
        }
      })
      
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.meta.arg);
      })
      
      // Skills
      .addCase(fetchAdminSkills.pending, (state) => {
        state.isLoadingSkills = true;
        state.skillError = undefined;
      })
      .addCase(fetchAdminSkills.fulfilled, (state, action) => {
        state.isLoadingSkills = false;
        if (isDefined(action.payload.data)) {
          state.skills = action.payload.data;
          state.pagination.skills.total = withDefault(action.payload.totalRecords, action.payload.data?.length || 0);
        }
        state.skillError = undefined;
      })
      .addCase(fetchAdminSkills.rejected, (state, action) => {
        state.isLoadingSkills = false;
        state.skillError = action.payload?.message;
      })
      
      .addCase(moderateSkill.fulfilled, (state, action) => {
        if (isDefined(action.payload.data)) {
          const index = state.skills.findIndex(skill => skill.id === action.payload.data.id);
          if (index !== -1) {
            state.skills[index] = action.payload.data;
          }
        }
      })
      
      // Appointments
      .addCase(fetchAdminAppointments.pending, (state) => {
        state.isLoadingAppointments = true;
        state.appointmentError = undefined;
      })
      .addCase(fetchAdminAppointments.fulfilled, (state, action) => {
        state.isLoadingAppointments = false;
        state.appointments = action.payload.data;
        state.pagination.appointments.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.appointmentError = undefined;
      })
      .addCase(fetchAdminAppointments.rejected, (state, action) => {
        state.isLoadingAppointments = false;
        state.appointmentError = action.payload?.message;
      })
      
      // Matches
      .addCase(fetchAdminMatches.pending, (state) => {
        state.isLoadingMatches = true;
        state.matchError = undefined;
      })
      .addCase(fetchAdminMatches.fulfilled, (state, action) => {
        state.isLoadingMatches = false;
        state.matches = action.payload.data;
        state.pagination.matches.total = action.payload.totalRecords || action.payload.data.length || 0;
        state.matchError = undefined;
      })
      .addCase(fetchAdminMatches.rejected, (state, action) => {
        state.isLoadingMatches = false;
        state.matchError = action.payload?.message;
      })
      
      // Analytics
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.isLoadingAnalytics = true;
        state.analyticsError = undefined;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.isLoadingAnalytics = false;
        state.analytics = action.payload.data;
        state.analyticsError = undefined;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.isLoadingAnalytics = false;
        state.analyticsError = action.payload?.message;
      })
      
      // System Health
      .addCase(fetchSystemHealth.pending, (state) => {
        state.isLoadingSystemHealth = true;
        state.systemHealthError = undefined;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.isLoadingSystemHealth = false;
        state.systemHealth = action.payload.data;
        state.systemHealthError = undefined;
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.isLoadingSystemHealth = false;
        state.systemHealthError = action.payload?.message;
      })
      
      // Audit Logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.isLoadingAuditLogs = true;
        state.auditLogError = undefined;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.isLoadingAuditLogs = false;
        state.auditLogs = action.payload.data;
        state.pagination.auditLogs.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.auditLogError = undefined;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.isLoadingAuditLogs = false;
        state.auditLogError = action.payload?.message;
      })
      
      // Moderation Reports
      .addCase(fetchModerationReports.pending, (state) => {
        state.isLoadingReports = true;
        state.reportError = undefined;
      })
      .addCase(fetchModerationReports.fulfilled, (state, action) => {
        state.isLoadingReports = false;
        state.moderationReports = action.payload.data;
        state.pagination.reports.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.reportError = undefined;
      })
      .addCase(fetchModerationReports.rejected, (state, action) => {
        state.isLoadingReports = false;
        state.reportError = action.payload?.message;
      })
      
      .addCase(handleModerationReport.fulfilled, (state, action) => {
        const index = state.moderationReports.findIndex(report => report.id === action.payload.data.id);
        if (index !== -1) {
          state.moderationReports[index] = action.payload.data;
        }
      })
      
      // Settings
      .addCase(fetchAdminSettings.pending, (state) => {
        state.isLoadingSettings = true;
        state.settingsError = undefined;
      })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => {
        state.isLoadingSettings = false;
        state.settings = action.payload.data;
        state.settingsError = undefined;
      })
      .addCase(fetchAdminSettings.rejected, (state, action) => {
        state.isLoadingSettings = false;
        state.settingsError = action.payload?.message;
      })
      
      .addCase(updateAdminSettings.fulfilled, (state, action) => {
        state.settings = action.payload.data;
      });
  },
});

export const {
  clearError,
  clearUserError,
  clearSkillError,
  clearAppointmentError,
  clearMatchError,
  clearAnalyticsError,
  clearSystemHealthError,
  clearAuditLogError,
  clearReportError,
  clearSettingsError,
  setUserFilters,
  setSkillFilters,
  setAppointmentFilters,
  setMatchFilters,
  setAuditLogFilters,
  setReportFilters,
  setUserPagination,
  setSkillPagination,
  setAppointmentPagination,
  setMatchPagination,
  setAuditLogPagination,
  setReportPagination,
  updateUserInList,
  removeUserFromList,
  updateSkillInList,
  updateReportInList,
  updateUserRoleOptimistic,
  suspendUserOptimistic,
  unsuspendUserOptimistic,
  deleteUserOptimistic,
  moderateSkillOptimistic,
  handleReportOptimistic,
  setUsers,
  setSkills,
  setModerationReports,
} = adminSlice.actions;

export default adminSlice.reducer;