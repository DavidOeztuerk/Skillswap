import { adminService } from "../../api/services/adminService";
import { createAppAsyncThunk } from "../../store/thunkHelpers";
import { SuccessResponse, isSuccessResponse, PagedSuccessResponse, isPagedResponse } from "../../types/api/UnifiedResponse";
import { AdminDashboardData, AdminUser, AdminSkill, AdminAppointment, AdminMatch, AuditLog, ModerationReport, AdminSettings } from "../../types/models/Admin";

// Dashboard
export const fetchAdminDashboard = createAppAsyncThunk<SuccessResponse<AdminDashboardData>, void>(
  'admin/fetchDashboard',
  async (_, { rejectWithValue }) => {
    const response = await adminService.getDashboard();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// User Management
export const fetchAdminUsers = createAppAsyncThunk<PagedSuccessResponse<AdminUser>, { page?: number; limit?: number; filters?: any }>(
  'admin/fetchUsers',
  async (params, { rejectWithValue }) => {
    const response = await adminService.getUsers(params);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

export const updateUserRole = createAppAsyncThunk<SuccessResponse<AdminUser>, { userId: string; role: string }>(
  'admin/updateUserRole',
  async ({ userId, role }: { userId: string; role: string }, { rejectWithValue }) => {
    const response = await adminService.updateUserRole(userId, role);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const suspendUser = createAppAsyncThunk<SuccessResponse<AdminUser>, { userId: string; reason: string }>(
  'admin/suspendUser',
  async ({ userId, reason }: { userId: string; reason: string }, { rejectWithValue }) => {
    const response = await adminService.suspendUser(userId, reason);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const unsuspendUser = createAppAsyncThunk<SuccessResponse<AdminUser>, string>(
  'admin/unsuspendUser',
  async (userId, { rejectWithValue }) => {
    const response = await adminService.unsuspendUser(userId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const deleteUser = createAppAsyncThunk<SuccessResponse<void>, string>(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    const response = await adminService.deleteUser(userId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// Skills Management
export const fetchAdminSkills = createAppAsyncThunk<PagedSuccessResponse<AdminSkill>, { page?: number; limit?: number; filters?: Record<string, string | number | boolean | undefined> }>(
  'admin/fetchSkills',
  async (params, { rejectWithValue }) => {
    const response = await adminService.getSkills(params);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

export const moderateSkill = createAppAsyncThunk<SuccessResponse<AdminSkill>, { skillId: string; action: 'approve' | 'reject' | 'quarantine'; reason?: string }>(
  'admin/moderateSkill',
  async ({ skillId, action, reason }, { rejectWithValue }) => {
    const response = await adminService.moderateSkill(skillId, action, reason);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// Appointments Management
export const fetchAdminAppointments = createAppAsyncThunk<PagedSuccessResponse<AdminAppointment>, { page?: number; limit?: number; filters?: Record<string, string | number | boolean | undefined> }>(
  'admin/fetchAppointments',
  async (params, { rejectWithValue }) => {
    const response = await adminService.getAppointments(params);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

// Matches Management
export const fetchAdminMatches = createAppAsyncThunk<PagedSuccessResponse<AdminMatch>, { page?: number; limit?: number; filters?: Record<string, string | number | boolean | undefined> }>(
  'admin/fetchMatches',
  async (params, { rejectWithValue }) => {
    const response = await adminService.getMatches(params);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

// Analytics
export const fetchAdminAnalytics = createAppAsyncThunk<SuccessResponse<any>, '7d' | '30d' | '90d' | '1y'>(
  'admin/fetchAnalytics',
  async (timeRange, { rejectWithValue }) => {
    const response = await adminService.getAnalytics(timeRange);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// System Health
export const fetchSystemHealth = createAppAsyncThunk<SuccessResponse<any>, void>(
  'admin/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    const response = await adminService.getSystemHealth();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// Audit Logs
export const fetchAuditLogs = createAppAsyncThunk<PagedSuccessResponse<AuditLog>, { page?: number; limit?: number; filters?: Record<string, string | number | boolean | undefined> }>(
  'admin/fetchAuditLogs',
  async (params, { rejectWithValue }) => {
    const response = await adminService.getAuditLogs(params);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

// Moderation Reports
export const fetchModerationReports = createAppAsyncThunk<PagedSuccessResponse<ModerationReport>, { page?: number; limit?: number; filters?: Record<string, string | number | boolean | undefined> }>(
  'admin/fetchReports',
  async (params, { rejectWithValue }) => {
    const response = await adminService.getModerationReports(params);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

export const handleModerationReport = createAppAsyncThunk<SuccessResponse<ModerationReport>, { reportId: string; action: 'approve' | 'reject' | 'escalate'; reason?: string }>(
  'admin/handleReport',
  async ({ reportId, action, reason }, { rejectWithValue }) => {
    const response = await adminService.handleModerationReport(reportId, action, reason);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// Settings
export const fetchAdminSettings = createAppAsyncThunk<SuccessResponse<AdminSettings>, void>(
  'admin/fetchSettings',
  async (_, { rejectWithValue }) => {
    const response = await adminService.getSettings();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const updateAdminSettings = createAppAsyncThunk<SuccessResponse<AdminSettings>, Partial<AdminSettings>>(
  'admin/updateSettings',
  async (settings, { rejectWithValue }) => {
    const response = await adminService.updateSettings(settings);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);