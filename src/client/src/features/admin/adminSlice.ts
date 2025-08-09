import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AdminState } from '../../types/states/AdminState';
import { SliceError } from '../../store/types';
import { adminService } from '../../api/services/adminService';
import {
  AdminUser,
  AdminSkill,
  ModerationReport,
  AdminSettings,
} from '../../types/models/Admin';

const createStandardError = (error: any): SliceError => ({
  message: error?.message || error?.data?.message || 'Ein unbekannter Admin-Fehler ist aufgetreten',
  code: error?.status || error?.code || 'ADMIN_ERROR',
  details: error?.data || error
});

const initialState: AdminState = {
  dashboard: null,
  users: [],
  skills: [],
  appointments: [],
  matches: [],
  analytics: null,
  systemHealth: null,
  auditLogs: [],
  moderationReports: [],
  settings: null,
  
  isLoading: false,
  isLoadingUsers: false,
  isLoadingSkills: false,
  isLoadingAppointments: false,
  isLoadingMatches: false,
  isLoadingAnalytics: false,
  isLoadingSystemHealth: false,
  isLoadingAuditLogs: false,
  isLoadingReports: false,
  isLoadingSettings: false,
  
  error: null,
  userError: null,
  skillError: null,
  appointmentError: null,
  matchError: null,
  analyticsError: null,
  systemHealthError: null,
  auditLogError: null,
  reportError: null,
  settingsError: null,
  
  pagination: {
    users: { page: 1, limit: 20, total: 0 },
    skills: { page: 1, limit: 20, total: 0 },
    appointments: { page: 1, limit: 20, total: 0 },
    matches: { page: 1, limit: 20, total: 0 },
    auditLogs: { page: 1, limit: 50, total: 0 },
    reports: { page: 1, limit: 20, total: 0 },
  },
  
  filters: {
    users: { status: 'all', role: 'all', search: '' },
    skills: { status: 'all', category: 'all', search: '' },
    appointments: { status: 'all', dateRange: null },
    matches: { status: 'all', dateRange: null },
    auditLogs: { action: 'all', user: '', dateRange: null },
    reports: { type: 'all', status: 'all' },
  },
};

// Dashboard
export const fetchAdminDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async () => {
    return await adminService.getDashboard();
  }
);

// User Management
export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params: { page?: number; limit?: number; filters?: any }) => {
    return await adminService.getUsers(params);
  }
);

export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }: { userId: string; role: string }) => {
    return await adminService.updateUserRole(userId, role);
  }
);

export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async ({ userId, reason }: { userId: string; reason: string }) => {
    return await adminService.suspendUser(userId, reason);
  }
);

export const unsuspendUser = createAsyncThunk(
  'admin/unsuspendUser',
  async (userId: string) => {
    return await adminService.unsuspendUser(userId);
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId: string) => {
    await adminService.deleteUser(userId);
    return userId;
  }
);

// Skills Management
export const fetchAdminSkills = createAsyncThunk(
  'admin/fetchSkills',
  async (params: { page?: number; limit?: number; filters?: any }) => {
    return await adminService.getSkills(params);
  }
);

export const moderateSkill = createAsyncThunk(
  'admin/moderateSkill',
  async ({ skillId, action, reason }: { skillId: string; action: 'approve' | 'reject' | 'quarantine'; reason?: string }) => {
    return await adminService.moderateSkill(skillId, action, reason);
  }
);

// Appointments Management
export const fetchAdminAppointments = createAsyncThunk(
  'admin/fetchAppointments',
  async (params: { page?: number; limit?: number; filters?: any }) => {
    return await adminService.getAppointments(params);
  }
);

// Matches Management
export const fetchAdminMatches = createAsyncThunk(
  'admin/fetchMatches',
  async (params: { page?: number; limit?: number; filters?: any }) => {
    return await adminService.getMatches(params);
  }
);

// Analytics
export const fetchAdminAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (timeRange: '7d' | '30d' | '90d' | '1y') => {
    return await adminService.getAnalytics(timeRange);
  }
);

// System Health
export const fetchSystemHealth = createAsyncThunk(
  'admin/fetchSystemHealth',
  async () => {
    return await adminService.getSystemHealth();
  }
);

// Audit Logs
export const fetchAuditLogs = createAsyncThunk(
  'admin/fetchAuditLogs',
  async (params: { page?: number; limit?: number; filters?: any }) => {
    return await adminService.getAuditLogs(params);
  }
);

// Moderation Reports
export const fetchModerationReports = createAsyncThunk(
  'admin/fetchReports',
  async (params: { page?: number; limit?: number; filters?: any }) => {
    return await adminService.getModerationReports(params);
  }
);

export const handleModerationReport = createAsyncThunk(
  'admin/handleReport',
  async ({ reportId, action, reason }: { reportId: string; action: 'approve' | 'reject' | 'escalate'; reason?: string }) => {
    return await adminService.handleModerationReport(reportId, action, reason);
  }
);

// Settings
export const fetchAdminSettings = createAsyncThunk(
  'admin/fetchSettings',
  async () => {
    return await adminService.getSettings();
  }
);

export const updateAdminSettings = createAsyncThunk(
  'admin/updateSettings',
  async (settings: Partial<AdminSettings>) => {
    return await adminService.updateSettings(settings);
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUserError: (state) => {
      state.userError = null;
    },
    clearSkillError: (state) => {
      state.skillError = null;
    },
    clearAppointmentError: (state) => {
      state.appointmentError = null;
    },
    clearMatchError: (state) => {
      state.matchError = null;
    },
    clearAnalyticsError: (state) => {
      state.analyticsError = null;
    },
    clearSystemHealthError: (state) => {
      state.systemHealthError = null;
    },
    clearAuditLogError: (state) => {
      state.auditLogError = null;
    },
    clearReportError: (state) => {
      state.reportError = null;
    },
    clearSettingsError: (state) => {
      state.settingsError = null;
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
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload.data;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = createStandardError(action.error);
      })
      
      // Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isLoadingUsers = true;
        state.userError = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isLoadingUsers = false;
        state.users = action.payload.data;
        state.pagination.users.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.userError = null;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isLoadingUsers = false;
        state.userError = createStandardError(action.error);
      })
      
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      
      .addCase(suspendUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      
      .addCase(unsuspendUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload);
      })
      
      // Skills
      .addCase(fetchAdminSkills.pending, (state) => {
        state.isLoadingSkills = true;
        state.skillError = null;
      })
      .addCase(fetchAdminSkills.fulfilled, (state, action) => {
        state.isLoadingSkills = false;
        state.skills = action.payload.data;
        state.pagination.skills.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.skillError = null;
      })
      .addCase(fetchAdminSkills.rejected, (state, action) => {
        state.isLoadingSkills = false;
        state.skillError = createStandardError(action.error);
      })
      
      .addCase(moderateSkill.fulfilled, (state, action) => {
        const index = state.skills.findIndex(skill => skill.id === action.payload.id);
        if (index !== -1) {
          state.skills[index] = action.payload;
        }
      })
      
      // Appointments
      .addCase(fetchAdminAppointments.pending, (state) => {
        state.isLoadingAppointments = true;
        state.appointmentError = null;
      })
      .addCase(fetchAdminAppointments.fulfilled, (state, action) => {
        state.isLoadingAppointments = false;
        state.appointments = action.payload.data;
        state.pagination.appointments.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.appointmentError = null;
      })
      .addCase(fetchAdminAppointments.rejected, (state, action) => {
        state.isLoadingAppointments = false;
        state.appointmentError = createStandardError(action.error);
      })
      
      // Matches
      .addCase(fetchAdminMatches.pending, (state) => {
        state.isLoadingMatches = true;
        state.matchError = null;
      })
      .addCase(fetchAdminMatches.fulfilled, (state, action) => {
        state.isLoadingMatches = false;
        state.matches = action.payload.data;
        state.pagination.matches.total = action.payload.totalRecords || action.payload.data.length || 0;
        state.matchError = null;
      })
      .addCase(fetchAdminMatches.rejected, (state, action) => {
        state.isLoadingMatches = false;
        state.matchError = createStandardError(action.error);
      })
      
      // Analytics
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.isLoadingAnalytics = true;
        state.analyticsError = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.isLoadingAnalytics = false;
        state.analytics = action.payload;
        state.analyticsError = null;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.isLoadingAnalytics = false;
        state.analyticsError = createStandardError(action.error);
      })
      
      // System Health
      .addCase(fetchSystemHealth.pending, (state) => {
        state.isLoadingSystemHealth = true;
        state.systemHealthError = null;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.isLoadingSystemHealth = false;
        state.systemHealth = action.payload;
        state.systemHealthError = null;
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.isLoadingSystemHealth = false;
        state.systemHealthError = createStandardError(action.error);
      })
      
      // Audit Logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.isLoadingAuditLogs = true;
        state.auditLogError = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.isLoadingAuditLogs = false;
        state.auditLogs = action.payload.data;
        state.pagination.auditLogs.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.auditLogError = null;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.isLoadingAuditLogs = false;
        state.auditLogError = createStandardError(action.error);
      })
      
      // Moderation Reports
      .addCase(fetchModerationReports.pending, (state) => {
        state.isLoadingReports = true;
        state.reportError = null;
      })
      .addCase(fetchModerationReports.fulfilled, (state, action) => {
        state.isLoadingReports = false;
        state.moderationReports = action.payload.data;
        state.pagination.reports.total = action.payload.totalRecords || action.payload.data?.length || 0;
        state.reportError = null;
      })
      .addCase(fetchModerationReports.rejected, (state, action) => {
        state.isLoadingReports = false;
        state.reportError = createStandardError(action.error);
      })
      
      .addCase(handleModerationReport.fulfilled, (state, action) => {
        const index = state.moderationReports.findIndex(report => report.id === action.payload.id);
        if (index !== -1) {
          state.moderationReports[index] = action.payload;
        }
      })
      
      // Settings
      .addCase(fetchAdminSettings.pending, (state) => {
        state.isLoadingSettings = true;
        state.settingsError = null;
      })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => {
        state.isLoadingSettings = false;
        state.settings = action.payload;
        state.settingsError = null;
      })
      .addCase(fetchAdminSettings.rejected, (state, action) => {
        state.isLoadingSettings = false;
        state.settingsError = createStandardError(action.error);
      })
      
      .addCase(updateAdminSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
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
} = adminSlice.actions;

export default adminSlice.reducer;