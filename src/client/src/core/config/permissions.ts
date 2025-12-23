export const Permissions = {
  // User Management
  READ_USERS: 'users:read',
  WRITE_USERS: 'users:write',
  DELETE_USERS: 'users:delete',
  MANAGE_USER_ROLES: 'users:manage_roles',

  // Skill Management
  READ_SKILLS: 'skills:read',
  WRITE_SKILLS: 'skills:write',
  DELETE_SKILLS: 'skills:delete',
  MANAGE_CATEGORIES: 'skills:manage_categories',

  // Matching
  ACCESS_MATCHING: 'matching:access',
  VIEW_ALL_MATCHES: 'matching:view_all',

  // Appointments
  READ_APPOINTMENTS: 'appointments:read',
  WRITE_APPOINTMENTS: 'appointments:write',
  DELETE_APPOINTMENTS: 'appointments:delete',

  // Video Calls
  ACCESS_VIDEO_CALLS: 'videocalls:access',
  MANAGE_VIDEO_CALLS: 'videocalls:manage',

  // System
  ACCESS_ADMIN_PANEL: 'system:admin_panel',
  VIEW_SYSTEM_LOGS: 'system:logs',
  MANAGE_SYSTEM: 'system:manage',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
