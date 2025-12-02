// ============================================================================
// SKILLSWAP PERMISSION SYSTEM
// Auto-generated from Database Schema
// ============================================================================

// ============================================================================
// ROLES
// ============================================================================

/**
 * All available roles in the system
 * Priority determines role hierarchy (higher = more privileged)
 */
export const Roles = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  SERVICE: 'Service',
  MODERATOR: 'Moderator',
  USER: 'User',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

/**
 * Role hierarchy (higher number = higher privilege)
 */
export const RolePriority: Record<Role, number> = {
  [Roles.SUPER_ADMIN]: 1000,
  [Roles.ADMIN]: 900,
  [Roles.SERVICE]: 800,
  [Roles.MODERATOR]: 500,
  [Roles.USER]: 100,
};

/**
 * Role descriptions
 */
export const RoleDescriptions: Record<Role, string> = {
  [Roles.SUPER_ADMIN]: 'System administrator with full access',
  [Roles.ADMIN]: 'Platform administrator',
  [Roles.SERVICE]: 'Service-to-service communication',
  [Roles.MODERATOR]: 'Content moderator',
  [Roles.USER]: 'Regular platform user',
};

/**
 * System roles (cannot be deleted/modified)
 */
export const SystemRoles: Role[] = [
  Roles.SUPER_ADMIN,
  Roles.ADMIN,
  Roles.SERVICE,
  Roles.MODERATOR,
  Roles.USER,
];

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Permission categories
 */
export const PermissionCategories = {
  USERS: 'Users',
  SKILLS: 'Skills',
  MATCHING: 'Matching',
  ROLES: 'Roles',
  MESSAGES: 'Messages',
  PROFILE: 'Profile',
  SYSTEM: 'System',
  VIDEO_CALL: 'VideoCall',
  APPOINTMENTS: 'Appointments',
  MODERATION: 'Moderation',
  ADMIN: 'Admin',
  REVIEWS: 'Reviews',
  MODERATOR: 'Moderator',
} as const;

export type PermissionCategory = (typeof PermissionCategories)[keyof typeof PermissionCategories];

/**
 * All permissions organized by category
 */
export const Permissions = {
  // ─────────────────────────────────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────────────────────────────────
  Users: {
    VIEW: 'users.view',           // Legacy system permission
    MANAGE: 'users.manage',       // Legacy system permission
    VIEW_REPORTED: 'users:view_reported',
    VIEW_ALL: 'users:view_all',
    DELETE: 'users:delete',
    MANAGE_ROLES: 'users:manage_roles',
    READ_OWN: 'users:read_own',
    READ: 'users:read',
    UNBLOCK: 'users:unblock',
    BLOCK: 'users:block',
    UPDATE: 'users:update',
    UPDATE_OWN: 'users:update_own',
    CREATE: 'users:create',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Skills
  // ─────────────────────────────────────────────────────────────────────────
  Skills: {
    VIEW: 'skills.view',          // Legacy system permission
    MANAGE: 'skills.manage',      // Legacy system permission
    MANAGE_CATEGORIES: 'skills:manage_categories',
    VIEW_ALL: 'skills:view_all',
    MANAGE_PROFICIENCY: 'skills:manage_proficiency',
    VERIFY: 'skills:verify',
    UPDATE_OWN: 'skills:update_own',
    DELETE_OWN: 'skills:delete_own',
    CREATE_OWN: 'skills:create_own',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Matching
  // ─────────────────────────────────────────────────────────────────────────
  Matching: {
    ACCESS: 'matching:access',
    VIEW_ALL: 'matching:view_all',
    MANAGE: 'matching:manage',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Roles & Permissions
  // ─────────────────────────────────────────────────────────────────────────
  Roles: {
    VIEW: 'roles:view',
    CREATE: 'roles:create',
    UPDATE: 'roles:update',
    DELETE: 'roles:delete',
    MANAGE_PERMISSIONS: 'permissions:manage',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────────────────────────────────
  Messages: {
    VIEW_OWN: 'messages:view_own',
    VIEW_ALL: 'messages:view_all',
    SEND: 'messages:send',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────────────────────────────────
  Profile: {
    VIEW_ANY: 'profile:view_any',
    VIEW_OWN: 'profile:view_own',
    UPDATE_OWN: 'profile:update_own',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // System
  // ─────────────────────────────────────────────────────────────────────────
  System: {
    MANAGE_INTEGRATIONS: 'system:manage_integrations',
    VIEW_LOGS: 'system:view_logs',
    MANAGE_ALL: 'system:manage_all',
    MANAGE_SETTINGS: 'system:manage_settings',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Video Calls
  // ─────────────────────────────────────────────────────────────────────────
  VideoCalls: {
    MANAGE: 'videocalls:manage',
    ACCESS: 'videocalls:access',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Appointments
  // ─────────────────────────────────────────────────────────────────────────
  Appointments: {
    CANCEL_ANY: 'appointments:cancel_any',
    CANCEL_OWN: 'appointments:cancel_own',
    VIEW_ALL: 'appointments:view_all',
    VIEW_OWN: 'appointments:view_own',
    CREATE: 'appointments:create',
    MANAGE: 'appointments:manage',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Moderation
  // ─────────────────────────────────────────────────────────────────────────
  Moderation: {
    VIEW_REPORTS: 'reports:view_all',
    MODERATE_CONTENT: 'content:moderate',
    HANDLE_REPORTS: 'reports:handle',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────────────────────────────────────
  Admin: {
    VIEW_STATISTICS: 'admin:view_statistics',
    ACCESS_DASHBOARD: 'admin:access_dashboard',
    MANAGE_ALL: 'admin:manage_all',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Reviews
  // ─────────────────────────────────────────────────────────────────────────
  Reviews: {
    CREATE: 'reviews:create',
    MODERATE: 'reviews:moderate',
    DELETE: 'reviews:delete',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Moderator Panel
  // ─────────────────────────────────────────────────────────────────────────
  Moderator: {
    ACCESS_PANEL: 'moderator:access_panel',
  },
} as const;

// Generate flat permission type
type PermissionValues<T> = T extends Record<string, infer V>
  ? V extends string
    ? V
    : V extends Record<string, string>
      ? V[keyof V]
      : never
  : never;

export type Permission = PermissionValues<typeof Permissions>;

// ============================================================================
// PERMISSION LISTS (for easy iteration)
// ============================================================================

/**
 * All permissions as flat array
 */
export const AllPermissions: Permission[] = Object.values(Permissions).flatMap(
  (category) => Object.values(category)
) as Permission[];

/**
 * Permissions grouped by category (for UI)
 */
export const PermissionsByCategory: Record<PermissionCategory, Permission[]> = {
  [PermissionCategories.USERS]: Object.values(Permissions.Users),
  [PermissionCategories.SKILLS]: Object.values(Permissions.Skills),
  [PermissionCategories.MATCHING]: Object.values(Permissions.Matching),
  [PermissionCategories.ROLES]: Object.values(Permissions.Roles),
  [PermissionCategories.MESSAGES]: Object.values(Permissions.Messages),
  [PermissionCategories.PROFILE]: Object.values(Permissions.Profile),
  [PermissionCategories.SYSTEM]: Object.values(Permissions.System),
  [PermissionCategories.VIDEO_CALL]: Object.values(Permissions.VideoCalls),
  [PermissionCategories.APPOINTMENTS]: Object.values(Permissions.Appointments),
  [PermissionCategories.MODERATION]: Object.values(Permissions.Moderation),
  [PermissionCategories.ADMIN]: Object.values(Permissions.Admin),
  [PermissionCategories.REVIEWS]: Object.values(Permissions.Reviews),
  [PermissionCategories.MODERATOR]: Object.values(Permissions.Moderator),
};

/**
 * System permissions (cannot be modified)
 */
export const SystemPermissions: Permission[] = [
  Permissions.Users.VIEW,
  Permissions.Users.MANAGE,
  Permissions.Skills.VIEW,
  Permissions.Skills.MANAGE,
  Permissions.Roles.VIEW,
  Permissions.Roles.CREATE,
  Permissions.Roles.UPDATE,
  Permissions.Roles.DELETE,
  Permissions.Roles.MANAGE_PERMISSIONS,
  Permissions.System.MANAGE_INTEGRATIONS,
  Permissions.System.VIEW_LOGS,
  Permissions.System.MANAGE_ALL,
  Permissions.System.MANAGE_SETTINGS,
];

// ============================================================================
// DEFAULT ROLE PERMISSIONS
// ============================================================================

/**
 * Default permissions for each role
 * Based on RolePermissions.csv from database
 */
export const DefaultRolePermissions: Record<Role, Permission[]> = {
  // SuperAdmin has ALL permissions
  [Roles.SUPER_ADMIN]: AllPermissions,

  // Admin has most permissions except some system-level ones
  [Roles.ADMIN]: [
    // Users
    Permissions.Users.VIEW,
    Permissions.Users.MANAGE,
    Permissions.Users.VIEW_REPORTED,
    Permissions.Users.VIEW_ALL,
    Permissions.Users.DELETE,
    Permissions.Users.MANAGE_ROLES,
    Permissions.Users.BLOCK,
    Permissions.Users.UNBLOCK,
    Permissions.Users.UPDATE,
    // Skills
    Permissions.Skills.VIEW,
    Permissions.Skills.MANAGE,
    Permissions.Skills.MANAGE_CATEGORIES,
    Permissions.Skills.VIEW_ALL,
    Permissions.Skills.MANAGE_PROFICIENCY,
    Permissions.Skills.VERIFY,
    Permissions.Skills.UPDATE_OWN,
    Permissions.Skills.DELETE_OWN,
    // Matching
    Permissions.Matching.ACCESS,
    Permissions.Matching.VIEW_ALL,
    Permissions.Matching.MANAGE,
    // Messages
    Permissions.Messages.VIEW_OWN,
    Permissions.Messages.VIEW_ALL,
    Permissions.Messages.SEND,
    // Profile
    Permissions.Profile.VIEW_ANY,
    Permissions.Profile.VIEW_OWN,
    Permissions.Profile.UPDATE_OWN,
    // Video Calls
    Permissions.VideoCalls.ACCESS,
    Permissions.VideoCalls.MANAGE,
    // Appointments
    Permissions.Appointments.CANCEL_ANY,
    Permissions.Appointments.CANCEL_OWN,
    Permissions.Appointments.VIEW_ALL,
    Permissions.Appointments.VIEW_OWN,
    Permissions.Appointments.CREATE,
    Permissions.Appointments.MANAGE,
    // Moderation
    Permissions.Moderation.VIEW_REPORTS,
    Permissions.Moderation.MODERATE_CONTENT,
    Permissions.Moderation.HANDLE_REPORTS,
    // Admin
    Permissions.Admin.VIEW_STATISTICS,
    Permissions.Admin.ACCESS_DASHBOARD,
    // Reviews
    Permissions.Reviews.CREATE,
    Permissions.Reviews.MODERATE,
    Permissions.Reviews.DELETE,
  ],

  // Service account (minimal permissions for inter-service communication)
  [Roles.SERVICE]: [],

  // Moderator
  [Roles.MODERATOR]: [
    // Users
    Permissions.Users.VIEW_REPORTED,
    Permissions.Users.READ_OWN,
    // Skills
    Permissions.Skills.VIEW_ALL,
    Permissions.Skills.VERIFY,
    Permissions.Skills.CREATE_OWN,
    Permissions.Skills.UPDATE_OWN,
    Permissions.Skills.DELETE_OWN,
    // Matching
    Permissions.Matching.ACCESS,
    // Messages
    Permissions.Messages.VIEW_OWN,
    Permissions.Messages.SEND,
    // Profile
    Permissions.Profile.VIEW_OWN,
    Permissions.Profile.UPDATE_OWN,
    // Video Calls
    Permissions.VideoCalls.ACCESS,
    // Appointments
    Permissions.Appointments.CANCEL_OWN,
    Permissions.Appointments.VIEW_OWN,
    Permissions.Appointments.CREATE,
    // Moderation
    Permissions.Moderation.VIEW_REPORTS,
    Permissions.Moderation.MODERATE_CONTENT,
    Permissions.Moderation.HANDLE_REPORTS,
    // Reviews
    Permissions.Reviews.CREATE,
    Permissions.Reviews.MODERATE,
    // Moderator
    Permissions.Moderator.ACCESS_PANEL,
  ],

  // Regular User
  [Roles.USER]: [
    // Users
    Permissions.Users.READ_OWN,
    Permissions.Users.UPDATE_OWN,
    // Skills
    Permissions.Skills.CREATE_OWN,
    Permissions.Skills.UPDATE_OWN,
    Permissions.Skills.DELETE_OWN,
    // Matching
    Permissions.Matching.ACCESS,
    // Messages
    Permissions.Messages.VIEW_OWN,
    Permissions.Messages.SEND,
    // Profile
    Permissions.Profile.VIEW_OWN,
    Permissions.Profile.UPDATE_OWN,
    // Video Calls
    Permissions.VideoCalls.ACCESS,
    // Appointments
    Permissions.Appointments.CANCEL_OWN,
    Permissions.Appointments.VIEW_OWN,
    Permissions.Appointments.CREATE,
    // Reviews
    Permissions.Reviews.CREATE,
  ],
};

// ============================================================================
// ROUTE PERMISSION MAPPING
// ============================================================================

/**
 * Route permission requirements for frontend routing
 */
export const RoutePermissions = {
  // ─────────────────────────────────────────────────────────────────────────
  // Public Routes (no auth required)
  // ─────────────────────────────────────────────────────────────────────────
  public: {
    home: { requireAuth: false },
    login: { requireAuth: false },
    register: { requireAuth: false },
    search: { requireAuth: false },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Protected Routes (any authenticated user)
  // ─────────────────────────────────────────────────────────────────────────
  protected: {
    dashboard: { requireAuth: true },
    profile: {
      requireAuth: true,
      permissions: [Permissions.Profile.VIEW_OWN],
    },
    settings: { requireAuth: true },
    notifications: { requireAuth: true },

    // Skills
    skills: {
      list: { requireAuth: true },
      detail: { requireAuth: true },
      edit: {
        requireAuth: true,
        permissions: [Permissions.Skills.UPDATE_OWN],
      },
      create: {
        requireAuth: true,
        permissions: [Permissions.Skills.CREATE_OWN],
      },
    },

    // Matchmaking
    matchmaking: {
      overview: {
        requireAuth: true,
        permissions: [Permissions.Matching.ACCESS],
      },
      timeline: {
        requireAuth: true,
        permissions: [Permissions.Matching.ACCESS],
      },
      matches: {
        requireAuth: true,
        permissions: [Permissions.Matching.ACCESS],
      },
    },

    // Appointments
    appointments: {
      list: {
        requireAuth: true,
        permissions: [Permissions.Appointments.VIEW_OWN],
      },
      calendar: {
        requireAuth: true,
        permissions: [Permissions.Appointments.VIEW_OWN],
      },
      detail: {
        requireAuth: true,
        permissions: [Permissions.Appointments.VIEW_OWN],
      },
    },

    // Video Call
    videoCall: {
      requireAuth: true,
      permissions: [Permissions.VideoCalls.ACCESS],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Admin Routes
  // ─────────────────────────────────────────────────────────────────────────
  admin: {
    dashboard: {
      permissions: [Permissions.Admin.ACCESS_DASHBOARD],
    },
    users: {
      permissions: [Permissions.Users.VIEW_ALL],
    },
    skills: {
      roles: [Roles.ADMIN, Roles.SUPER_ADMIN],
    },
    skillCategories: {
      permissions: [Permissions.Skills.MANAGE_CATEGORIES],
    },
    proficiencyLevels: {
      permissions: [Permissions.Skills.MANAGE_PROFICIENCY],
    },
    appointments: {
      permissions: [Permissions.Appointments.MANAGE],
    },
    matches: {
      permissions: [Permissions.Matching.MANAGE],
    },
    analytics: {
      permissions: [Permissions.Admin.VIEW_STATISTICS],
    },
    systemHealth: {
      permissions: [Permissions.System.VIEW_LOGS],
    },
    auditLogs: {
      permissions: [Permissions.System.VIEW_LOGS],
    },
    moderation: {
      permissions: [Permissions.Moderation.HANDLE_REPORTS],
    },
    settings: {
      permissions: [Permissions.System.MANAGE_SETTINGS],
    },
    security: {
      roles: [Roles.ADMIN, Roles.SUPER_ADMIN],
    },
    metrics: {
      permissions: [Permissions.Admin.VIEW_STATISTICS],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SuperAdmin Routes (highest privilege)
  // ─────────────────────────────────────────────────────────────────────────
  superAdmin: {
    systemConfig: {
      roles: [Roles.SUPER_ADMIN],
      permissions: [Permissions.System.MANAGE_ALL],
    },
    roleManagement: {
      permissions: [Permissions.Roles.MANAGE_PERMISSIONS],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Moderator Routes
  // ─────────────────────────────────────────────────────────────────────────
  moderator: {
    panel: {
      permissions: [Permissions.Moderator.ACCESS_PANEL],
    },
    reports: {
      permissions: [Permissions.Moderation.VIEW_REPORTS],
    },
    contentReview: {
      permissions: [Permissions.Moderation.MODERATE_CONTENT],
    },
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role has higher or equal priority than another
 */
export const hasHigherOrEqualPriority = (role: Role, thanRole: Role): boolean => {
  return RolePriority[role] >= RolePriority[thanRole];
};

/**
 * Check if a role is admin-level (Admin or SuperAdmin)
 */
export const isAdminRole = (role: Role): boolean => {
  return role === Roles.ADMIN || role === Roles.SUPER_ADMIN;
};

/**
 * Check if a role is moderator-level or higher
 */
export const isModeratorOrHigher = (role: Role): boolean => {
  return RolePriority[role] >= RolePriority[Roles.MODERATOR];
};

/**
 * Get all roles that include a specific permission by default
 */
export const getRolesWithPermission = (permission: Permission): Role[] => {
  return (Object.entries(DefaultRolePermissions) as [Role, Permission[]][])
    .filter(([_, permissions]) => permissions.includes(permission))
    .map(([role]) => role);
};

/**
 * Check if a permission is a system permission
 */
export const isSystemPermission = (permission: Permission): boolean => {
  return SystemPermissions.includes(permission);
};

/**
 * Get the category of a permission
 */
export const getPermissionCategory = (permission: Permission): PermissionCategory | null => {
  for (const [category, permissions] of Object.entries(PermissionsByCategory)) {
    if ((permissions as Permission[]).includes(permission)) {
      return category as PermissionCategory;
    }
  }
  return null;
};

/**
 * Parse permission string to get resource and action
 * Handles both formats: "resource.action" and "resource:action"
 */
export const parsePermission = (permission: string): { resource: string; action: string } | null => {
  const dotMatch = permission.match(/^([a-z]+)\.([a-z_]+)$/);
  if (dotMatch) {
    return { resource: dotMatch[1], action: dotMatch[2] };
  }

  const colonMatch = permission.match(/^([a-z]+):([a-z_]+)$/);
  if (colonMatch) {
    return { resource: colonMatch[1], action: colonMatch[2] };
  }

  return null;
};

/**
 * Validate if a permission string is valid
 */
export const isValidPermission = (permission: string): permission is Permission => {
  return AllPermissions.includes(permission as Permission);
};

/**
 * Validate if a role string is valid
 */
export const isValidRole = (role: string): role is Role => {
  return Object.values(Roles).includes(role as Role);
};

// ============================================================================
// EXPORTS FOR ROUTER
// ============================================================================

/**
 * Admin roles for router configuration
 */
export const AdminRoles: Role[] = [Roles.ADMIN, Roles.SUPER_ADMIN];

/**
 * Moderator roles (includes admins) for router configuration
 */
export const ModeratorRoles: Role[] = [Roles.MODERATOR, Roles.ADMIN, Roles.SUPER_ADMIN];

/**
 * All privileged roles for router configuration
 */
export const PrivilegedRoles: Role[] = [Roles.MODERATOR, Roles.ADMIN, Roles.SUPER_ADMIN];
