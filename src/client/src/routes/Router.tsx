import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import App from '../App';
import { createLazyRoute, preloadComponents } from '../components/routing/withSuspense';
import { Permissions, Roles } from '../components/auth/permissions.constants';
import ForbiddenPage from '@/pages/ForbiddenPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { SkillsPageAll, SkillsPageMine, SkillsPageFavorite } from './SkillsPageWrappers';

// ============================================================================
// Public Routes - keine Authentifizierung erforderlich
// ============================================================================

const publicRoutes = {
  home: createLazyRoute(() => import('../pages/HomePage'), {
    useSkeleton: true,
    skeletonVariant: 'dashboard',
  }),

  login: createLazyRoute(() => import('../pages/auth/LoginPage'), {
    useSkeleton: true,
    skeletonVariant: 'form',
  }),

  register: createLazyRoute(() => import('../pages/auth/RegisterPage'), {
    useSkeleton: true,
    skeletonVariant: 'form',
  }),

  search: createLazyRoute(() => import('../pages/search/SearchResultsPage'), {
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Suchergebnisse werden geladen...',
  }),
};

// ============================================================================
// Protected Routes - Authentifizierung erforderlich (any authenticated user)
// ============================================================================

const protectedRoutes = {
  dashboard: createLazyRoute(() => import('../pages/DashboardPage'), {
    requireAuth: true, // ✅ Explicit auth requirement (replaces roles: ['*'])
    useSkeleton: true,
    skeletonVariant: 'dashboard',
  }),

  // Skills Module
  skills: {
    list: createLazyRoute(() => import('../pages/skills/SkillsPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    detail: createLazyRoute(() => import('../pages/skills/SkillDetailPage'), {
      // Public route - guests can view skill details, auth required for match requests
      useSkeleton: true,
      skeletonVariant: 'details',
    }),
    edit: createLazyRoute(() => import('../pages/skills/SkillEditPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'form',
    }),
  },

  // Matchmaking Module
  matchmaking: {
    overview: createLazyRoute(() => import('../pages/matchmaking/MatchmakingOverviewPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    timeline: createLazyRoute(() => import('../pages/matchmaking/MatchRequestTimelinePage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'details',
    }),
    matches: createLazyRoute(() => import('../pages/matchmaking/MatchesPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
      loadingMessage: 'Matches werden geladen...',
    }),
    matchDetail: createLazyRoute(() => import('../pages/matchmaking/MatchDetailPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'details',
      loadingMessage: 'Match-Details werden geladen...',
    }),
  },

  // Appointments Module
  appointments: {
    list: createLazyRoute(() => import('../pages/appointments/AppointmentsPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    detail: createLazyRoute(() => import('../pages/sessions/SessionDetailPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'details',
      loadingMessage: 'Session wird geladen...',
    }),
    calendar: createLazyRoute(() => import('../pages/appointments/AppointmentCalendarPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'dashboard',
      loadingMessage: 'Kalender wird geladen...',
    }),
  },

  // Video Call - High Priority
  videoCall: createLazyRoute(() => import('../pages/videocall/VideoCallPage'), {
    requireAuth: true,
    useSkeleton: false,
    loadingMessage: 'Video-Call wird initialisiert...',
  }),

  // User Profile & Settings
  profile: createLazyRoute(() => import('../pages/profile/ProfilePage'), {
    requireAuth: true,
    useSkeleton: true,
    skeletonVariant: 'profile',
  }),

  securitySettings: createLazyRoute(() => import('../pages/settings/SecuritySettings'), {
    requireAuth: true,
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'Sicherheitseinstellungen werden geladen...',
  }),

  notificationPreferences: createLazyRoute(
    () => import('../pages/settings/NotificationPreferencesPage'),
    {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'form',
      loadingMessage: 'Benachrichtigungseinstellungen werden geladen...',
    }
  ),

  notifications: createLazyRoute(() => import('../pages/notifications/NotificationsPage'), {
    requireAuth: true,
    useSkeleton: true,
    skeletonVariant: 'list',
  }),
};

// ============================================================================
// Admin Routes - Role-based and Permission-based access
// ============================================================================

const adminRoutes = {
  // Permission-based routes
  dashboard: createLazyRoute(() => import('../pages/admin/Dashboard'), {
    permissions: [Permissions.Admin.ACCESS_DASHBOARD],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: 'Admin-Dashboard wird geladen...',
  }),

  users: createLazyRoute(() => import('../pages/admin/UserManagement'), {
    permissions: [Permissions.Users.VIEW_ALL],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Benutzer werden geladen...',
  }),

  // Role-based routes
  skills: createLazyRoute(() => import('../pages/admin/AdminSkillsPage'), {
    roles: [Roles.ADMIN, Roles.SUPER_ADMIN],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Skills werden geladen...',
  }),

  appointments: createLazyRoute(() => import('../pages/admin/AdminAppointmentsPage'), {
    permissions: [Permissions.Appointments.MANAGE],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Termine werden geladen...',
  }),

  matches: createLazyRoute(() => import('../pages/admin/AdminMatchesPage'), {
    permissions: [Permissions.Matching.MANAGE],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Matches werden geladen...',
  }),

  analytics: createLazyRoute(() => import('../pages/admin/AdminAnalyticsPage'), {
    permissions: [Permissions.Admin.VIEW_STATISTICS],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: 'Analytics werden geladen...',
  }),

  systemHealth: createLazyRoute(() => import('../pages/admin/AdminSystemHealthPage'), {
    permissions: [Permissions.System.VIEW_LOGS],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: 'System-Status wird geladen...',
  }),

  auditLogs: createLazyRoute(() => import('../pages/admin/AdminAuditLogsPage'), {
    permissions: [Permissions.System.VIEW_LOGS],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Audit-Logs werden geladen...',
  }),

  moderation: createLazyRoute(() => import('../pages/admin/AdminModerationPage'), {
    permissions: [Permissions.Moderation.HANDLE_REPORTS],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Moderations-Berichte werden geladen...',
  }),

  settings: createLazyRoute(() => import('../pages/admin/AdminSettingsPage'), {
    permissions: [Permissions.System.MANAGE_SETTINGS],
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'Einstellungen werden geladen...',
  }),

  security: createLazyRoute(() => import('../pages/admin/AdminSecurityPage'), {
    roles: [Roles.ADMIN, Roles.SUPER_ADMIN],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Security Alerts werden geladen...',
  }),

  metrics: createLazyRoute(() => import('../pages/admin/AdminMetricsPage'), {
    permissions: [Permissions.Admin.VIEW_STATISTICS],
    useSkeleton: true,
    skeletonVariant: 'list',
  }),

  // Permission-based skill management
  skillCategories: createLazyRoute(() => import('../pages/admin/SkillCategoriesManagement'), {
    permissions: [Permissions.Skills.MANAGE_CATEGORIES],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Skill-Kategorien werden geladen...',
  }),

  proficiencyLevels: createLazyRoute(() => import('../pages/admin/ProficiencyLevelsManagement'), {
    permissions: [Permissions.Skills.MANAGE_PROFICIENCY],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Proficiency Levels werden geladen...',
  }),
};

// ============================================================================
// SuperAdmin Routes - Highest privilege level (requireAll for stricter access)
// ============================================================================

const superAdminRoutes = {
  // Requires BOTH SuperAdmin role AND system:manage_all permission
  systemConfig: createLazyRoute(() => import('../pages/admin/AdminSettingsPage'), {
    roles: [Roles.SUPER_ADMIN],
    permissions: [Permissions.System.MANAGE_ALL],
    requireAll: true,
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'System-Konfiguration wird geladen...',
  }),

  // Role management (SuperAdmin only)
  roleManagement: createLazyRoute(() => import('../pages/admin/AdminSettingsPage'), {
    permissions: [Permissions.Roles.MANAGE_PERMISSIONS],
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'Rollen-Verwaltung wird geladen...',
  }),
};

// ============================================================================
// Error Pages - No protection needed
// ============================================================================

// const errorPages = createLazyComponents({
//   notFound: () => import('../pages/NotFoundPage'),
//   forbidden: () => import('../pages/ForbiddenPage'),
//   unauthorized: () => import('../pages/UnauthorizedPage'),
// }, {
//   useSkeleton: false,
//   withErrorBoundary: false,
// });

// ============================================================================
// Preloading-Strategien
// ============================================================================

export const preloadStrategies = {
  critical: async () => {
    await preloadComponents([publicRoutes.home, protectedRoutes.dashboard]);
  },

  authFlow: async () => {
    await preloadComponents([publicRoutes.login, publicRoutes.register, protectedRoutes.dashboard]);
  },

  mainFeatures: async () => {
    await preloadComponents([
      protectedRoutes.skills.list,
      protectedRoutes.matchmaking.overview,
      protectedRoutes.appointments.list,
    ]);
  },

  adminArea: async () => {
    await preloadComponents([adminRoutes.dashboard, adminRoutes.users, adminRoutes.analytics]);
  },
};

// ============================================================================
// Route-Konfiguration
// ============================================================================

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      // ─────────────────────────────────────────────────────────────────────
      // Public Routes
      // ─────────────────────────────────────────────────────────────────────
      {
        index: true,
        element: <publicRoutes.home.component />,
      },
      {
        path: 'auth/login',
        element: <publicRoutes.login.component />,
      },
      {
        path: 'auth/register',
        element: <publicRoutes.register.component />,
      },
      {
        path: 'search',
        element: <publicRoutes.search.component />,
      },

      // ─────────────────────────────────────────────────────────────────────
      // Protected Routes (any authenticated user)
      // ─────────────────────────────────────────────────────────────────────
      {
        path: 'dashboard',
        element: <protectedRoutes.dashboard.component />,
      },

      // Skills Routes
      {
        path: 'skills',
        children: [
          {
            index: true,
            element: <SkillsPageAll />,
          },
          {
            path: 'my-skills',
            element: <SkillsPageMine />,
          },
          {
            path: 'favorites',
            element: <SkillsPageFavorite />,
          },
          {
            path: ':skillId',
            element: <protectedRoutes.skills.detail.component />,
          },
          {
            path: ':skillId/edit',
            element: <protectedRoutes.skills.edit.component />,
          },
        ],
      },

      // Matchmaking Routes
      {
        path: 'matchmaking',
        children: [
          {
            index: true,
            element: <protectedRoutes.matchmaking.overview.component />,
          },
          {
            path: 'timeline/:threadId',
            element: <protectedRoutes.matchmaking.timeline.component />,
          },
          {
            path: 'matches',
            element: <protectedRoutes.matchmaking.matches.component />,
          },
          {
            path: 'matches/:matchId',
            element: <protectedRoutes.matchmaking.matchDetail.component />,
          },
        ],
      },

      // Appointments Routes
      {
        path: 'appointments',
        children: [
          {
            index: true,
            element: <protectedRoutes.appointments.calendar.component />,
          },
          {
            path: ':appointmentId',
            element: <protectedRoutes.appointments.detail.component />,
          },
        ],
      },

      // Video Call
      {
        path: 'videocall/:appointmentId',
        element: <protectedRoutes.videoCall.component />,
      },

      // Profile & Settings
      {
        path: 'profile',
        element: <protectedRoutes.profile.component />,
      },
      {
        path: 'settings/security',
        element: <protectedRoutes.securitySettings.component />,
      },
      {
        path: 'settings/notifications',
        element: <protectedRoutes.notificationPreferences.component />,
      },
      {
        path: 'notifications',
        element: <protectedRoutes.notifications.component />,
      },

      // ─────────────────────────────────────────────────────────────────────
      // Admin Routes (role-based & permission-based)
      // ─────────────────────────────────────────────────────────────────────
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <adminRoutes.dashboard.component />,
          },
          {
            path: 'dashboard',
            element: <adminRoutes.dashboard.component />,
          },
          {
            path: 'users',
            element: <adminRoutes.users.component />,
          },
          {
            path: 'skills',
            children: [
              {
                index: true,
                element: <adminRoutes.skills.component />,
              },
              {
                path: 'categories',
                element: <adminRoutes.skillCategories.component />,
              },
              {
                path: 'proficiency',
                element: <adminRoutes.proficiencyLevels.component />,
              },
            ],
          },
          {
            path: 'appointments',
            element: <adminRoutes.appointments.component />,
          },
          {
            path: 'matches',
            element: <adminRoutes.matches.component />,
          },
          {
            path: 'analytics',
            element: <adminRoutes.analytics.component />,
          },
          {
            path: 'system-health',
            element: <adminRoutes.systemHealth.component />,
          },
          {
            path: 'metrics',
            element: <adminRoutes.metrics.component />,
          },
          {
            path: 'audit-logs',
            element: <adminRoutes.auditLogs.component />,
          },
          {
            path: 'moderation',
            element: <adminRoutes.moderation.component />,
          },
          {
            path: 'settings',
            element: <adminRoutes.settings.component />,
          },
          {
            path: 'security',
            element: <adminRoutes.security.component />,
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────────
      // Error Pages
      // ─────────────────────────────────────────────────────────────────────
      {
        path: 'forbidden',
        element: <ForbiddenPage />,
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

// ============================================================================
// Router erstellen
// ============================================================================

export const router = createBrowserRouter(routes);

// ============================================================================
// Hook für Route-Preloading
// ============================================================================

/**
 * Flattens nested route objects into a flat map
 */
const flattenRoutes = (
  routesToFlatten: Record<string, unknown>,
  prefix = ''
): Record<string, { preload?: () => Promise<unknown> }> => {
  const result: Record<string, { preload?: () => Promise<unknown> }> = {};

  for (const [key, value] of Object.entries(routesToFlatten)) {
    const fullKey = prefix.length > 0 ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && 'preload' in value) {
      // It's a route with preload
      result[fullKey] = value as { preload: () => Promise<unknown> };
    } else if (value !== null && typeof value === 'object' && !('preload' in value)) {
      // It's a nested object - recurse
      Object.assign(result, flattenRoutes(value as Record<string, unknown>, fullKey));
    }
  }

  return result;
};

export const useRoutePreloading = (): {
  preloadRoute: (routeName: string) => void;
  preloadStrategy: (strategy: keyof typeof preloadStrategies) => void;
} => {
  const preloadRoute = (routeName: string): void => {
    // Flatten all routes including nested ones
    const allRoutes = {
      ...flattenRoutes(publicRoutes),
      ...flattenRoutes(protectedRoutes),
      ...flattenRoutes(adminRoutes),
      ...flattenRoutes(superAdminRoutes),
    };

    const route = allRoutes[routeName] as { preload?: () => Promise<unknown> } | undefined;
    const preloadFn = route?.preload;
    if (preloadFn !== undefined && typeof preloadFn === 'function') {
      void preloadFn();
    }
  };

  const preloadStrategy = (strategy: keyof typeof preloadStrategies): void => {
    void preloadStrategies[strategy]();
  };

  return { preloadRoute, preloadStrategy };
};

// ============================================================================
// Export für Navigation
// ============================================================================

export const routeConfig = {
  public: publicRoutes,
  protected: protectedRoutes,
  admin: adminRoutes,
  superAdmin: superAdminRoutes,
} as const;

// ============================================================================
// DISABLED - Initiales Preloading kann Infinite Loops verursachen
// ============================================================================
// if (typeof window !== 'undefined') {
//   setTimeout(() => {
//     preloadStrategies.critical();
//   }, 1000);
// }
