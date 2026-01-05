import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import App from '../../App';
import { Permissions, Roles } from '../../features/auth/components/permissions.constants';
import { createLazyRoute, preloadComponents } from '../../shared/components/routing/withSuspense';
import ForbiddenPage from '../../shared/pages/ForbiddenPage';
import NotFoundPage from '../../shared/pages/NotFoundPage';
import UnauthorizedPage from '../../shared/pages/UnauthorizedPage';
import { SkillsPageAll, SkillsPageMine, SkillsPageFavorite } from './SkillsPageWrappers';

// ============================================================================
// Public Routes - keine Authentifizierung erforderlich
// ============================================================================

const publicRoutes = {
  home: createLazyRoute(() => import('../../shared/pages/home/HomePage'), {
    useSkeleton: true,
    skeletonVariant: 'dashboard',
  }),

  login: createLazyRoute(() => import('../../features/auth/pages/LoginPage'), {
    useSkeleton: true,
    skeletonVariant: 'form',
  }),

  register: createLazyRoute(() => import('../../features/auth/pages/RegisterPage'), {
    useSkeleton: true,
    skeletonVariant: 'form',
  }),

  forgotPassword: createLazyRoute(() => import('../../features/auth/pages/ForgotPasswordPage'), {
    useSkeleton: true,
    skeletonVariant: 'form',
  }),

  resetPassword: createLazyRoute(() => import('../../features/auth/pages/ResetPasswordPage'), {
    useSkeleton: true,
    skeletonVariant: 'form',
  }),

  search: createLazyRoute(() => import('../../features/search/pages/SearchResultsPage'), {
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Suchergebnisse werden geladen...',
  }),
};

// ============================================================================
// Protected Routes - Authentifizierung erforderlich (any authenticated user)
// ============================================================================

const protectedRoutes = {
  dashboard: createLazyRoute(() => import('../../features/dashboard/pages/DashboardPage'), {
    requireAuth: true, // ✅ Explicit auth requirement (replaces roles: ['*'])
    useSkeleton: true,
    skeletonVariant: 'dashboard',
  }),

  // Skills Module
  skills: {
    list: createLazyRoute(() => import('../../features/skills/pages/SkillsPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    detail: createLazyRoute(() => import('../../features/skills/pages/SkillDetailPage'), {
      // Public route - guests can view skill details, auth required for match requests
      useSkeleton: true,
      skeletonVariant: 'details',
    }),
    edit: createLazyRoute(() => import('../../features/skills/pages/SkillEditPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'form',
    }),
  },

  // Matchmaking Module
  matchmaking: {
    overview: createLazyRoute(
      () => import('../../features/matchmaking/pages/MatchmakingOverviewPage'),
      {
        requireAuth: true,
        useSkeleton: true,
        skeletonVariant: 'list',
      }
    ),
    timeline: createLazyRoute(
      () => import('../../features/matchmaking/pages/MatchRequestTimelinePage'),
      {
        requireAuth: true,
        useSkeleton: true,
        skeletonVariant: 'details',
      }
    ),
    matches: createLazyRoute(() => import('../../features/matchmaking/pages/MatchesPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
      loadingMessage: 'Matches werden geladen...',
    }),
    matchDetail: createLazyRoute(() => import('../../features/matchmaking/pages/MatchDetailPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'details',
      loadingMessage: 'Match-Details werden geladen...',
    }),
  },

  // Appointments Module
  appointments: {
    list: createLazyRoute(() => import('../../features/appointments/pages/AppointmentsPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    detail: createLazyRoute(() => import('../../features/sessions/pages/SessionDetailPage'), {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'details',
      loadingMessage: 'Session wird geladen...',
    }),
    calendar: createLazyRoute(
      () => import('../../features/appointments/pages/AppointmentCalendarPage'),
      {
        requireAuth: true,
        useSkeleton: true,
        skeletonVariant: 'dashboard',
        loadingMessage: 'Kalender wird geladen...',
      }
    ),
  },

  // Video Call - High Priority
  videoCall: createLazyRoute(() => import('../../features/videocall/pages/VideoCallPage'), {
    requireAuth: true,
    useSkeleton: false,
    loadingMessage: 'Video-Call wird initialisiert...',
  }),

  // User Profile & Settings
  profile: createLazyRoute(() => import('../../features/profile/pages/ProfilePage'), {
    requireAuth: true,
    useSkeleton: true,
    skeletonVariant: 'profile',
  }),

  // Public Profile (andere User anzeigen) - öffentlich zugänglich
  publicProfile: createLazyRoute(() => import('../../features/profile/pages/PublicProfilePage'), {
    requireAuth: false,
    useSkeleton: true,
    skeletonVariant: 'profile',
    loadingMessage: 'Profil wird geladen...',
  }),

  // User Reviews Page - öffentlich zugänglich
  userReviews: createLazyRoute(() => import('../../features/profile/pages/ReviewsPage'), {
    requireAuth: false,
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Bewertungen werden geladen...',
  }),

  securitySettings: createLazyRoute(
    () => import('../../features/settings/pages/SecuritySettings'),
    {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'form',
      loadingMessage: 'Sicherheitseinstellungen werden geladen...',
    }
  ),

  notificationPreferences: createLazyRoute(
    () => import('../../features/settings/pages/NotificationPreferencesPage'),
    {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'form',
      loadingMessage: 'Benachrichtigungseinstellungen werden geladen...',
    }
  ),

  notifications: createLazyRoute(
    () => import('../../features/notifications/pages/NotificationsPage'),
    {
      requireAuth: true,
      useSkeleton: true,
      skeletonVariant: 'list',
    }
  ),

  // Chat Module
  chat: createLazyRoute(() => import('../../features/chat/pages/ChatPage'), {
    requireAuth: true,
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Nachrichten werden geladen...',
  }),
};

// ============================================================================
// Admin Routes - Role-based and Permission-based access
// ============================================================================

const adminRoutes = {
  // Permission-based routes
  dashboard: createLazyRoute(() => import('../../features/admin/pages/Dashboard'), {
    permissions: [Permissions.Admin.ACCESS_DASHBOARD],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: 'Admin-Dashboard wird geladen...',
  }),

  users: createLazyRoute(() => import('../../features/admin/pages/UserManagement'), {
    permissions: [Permissions.Users.VIEW_ALL],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Benutzer werden geladen...',
  }),

  // Role-based routes
  skills: createLazyRoute(() => import('../../features/admin/pages/AdminSkillsPage'), {
    roles: [Roles.ADMIN, Roles.SUPER_ADMIN],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Skills werden geladen...',
  }),

  appointments: createLazyRoute(() => import('../../features/admin/pages/AdminAppointmentsPage'), {
    permissions: [Permissions.Appointments.MANAGE],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Termine werden geladen...',
  }),

  matches: createLazyRoute(() => import('../../features/admin/pages/AdminMatchesPage'), {
    permissions: [Permissions.Matching.MANAGE],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Matches werden geladen...',
  }),

  analytics: createLazyRoute(() => import('../../features/admin/pages/AdminAnalyticsPage'), {
    permissions: [Permissions.Admin.VIEW_STATISTICS],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: 'Analytics werden geladen...',
  }),

  systemHealth: createLazyRoute(() => import('../../features/admin/pages/AdminSystemHealthPage'), {
    permissions: [Permissions.System.VIEW_LOGS],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: 'System-Status wird geladen...',
  }),

  auditLogs: createLazyRoute(() => import('../../features/admin/pages/AdminAuditLogsPage'), {
    permissions: [Permissions.System.VIEW_LOGS],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Audit-Logs werden geladen...',
  }),

  moderation: createLazyRoute(() => import('../../features/admin/pages/AdminModerationPage'), {
    permissions: [Permissions.Moderation.HANDLE_REPORTS],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Moderations-Berichte werden geladen...',
  }),

  settings: createLazyRoute(() => import('../../features/admin/pages/AdminSettingsPage'), {
    permissions: [Permissions.System.MANAGE_SETTINGS],
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'Einstellungen werden geladen...',
  }),

  emailTemplates: createLazyRoute(
    () => import('../../features/admin/pages/AdminEmailTemplatesPage'),
    {
      permissions: [Permissions.System.MANAGE_SETTINGS],
      useSkeleton: true,
      skeletonVariant: 'list',
      loadingMessage: 'Email Templates werden geladen...',
    }
  ),

  security: createLazyRoute(() => import('../../features/admin/pages/AdminSecurityPage'), {
    roles: [Roles.ADMIN, Roles.SUPER_ADMIN],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: 'Security Alerts werden geladen...',
  }),

  metrics: createLazyRoute(() => import('../../features/admin/pages/AdminMetricsPage'), {
    permissions: [Permissions.Admin.VIEW_STATISTICS],
    useSkeleton: true,
    skeletonVariant: 'list',
  }),

  // Permission-based skill management
  skillCategories: createLazyRoute(
    () => import('../../features/admin/pages/SkillCategoriesManagement'),
    {
      permissions: [Permissions.Skills.MANAGE_CATEGORIES],
      useSkeleton: true,
      skeletonVariant: 'list',
      loadingMessage: 'Skill-Kategorien werden geladen...',
    }
  ),

  proficiencyLevels: createLazyRoute(
    () => import('../../features/admin/pages/ProficiencyLevelsManagement'),
    {
      permissions: [Permissions.Skills.MANAGE_PROFICIENCY],
      useSkeleton: true,
      skeletonVariant: 'list',
      loadingMessage: 'Proficiency Levels werden geladen...',
    }
  ),
};

// ============================================================================
// SuperAdmin Routes - Highest privilege level (requireAll for stricter access)
// ============================================================================

const superAdminRoutes = {
  // Requires BOTH SuperAdmin role AND system:manage_all permission
  systemConfig: createLazyRoute(() => import('../../features/admin/pages/AdminSettingsPage'), {
    roles: [Roles.SUPER_ADMIN],
    permissions: [Permissions.System.MANAGE_ALL],
    requireAll: true,
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'System-Konfiguration wird geladen...',
  }),

  // Role management (SuperAdmin only)
  roleManagement: createLazyRoute(() => import('../../features/admin/pages/AdminSettingsPage'), {
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
//   notFound: () => import('../../pages/NotFoundPage'),
//   forbidden: () => import('../../pages/ForbiddenPage'),
//   unauthorized: () => import('../../pages/UnauthorizedPage'),
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
        path: 'auth/forgot-password',
        element: <publicRoutes.forgotPassword.component />,
      },
      {
        path: 'forgot-password',
        element: <publicRoutes.forgotPassword.component />,
      },
      {
        path: 'auth/reset-password',
        element: <publicRoutes.resetPassword.component />,
      },
      {
        path: 'reset-password',
        element: <publicRoutes.resetPassword.component />,
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
            path: ':matchId',
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
        path: 'users/:userId',
        element: <protectedRoutes.publicProfile.component />,
      },
      {
        path: 'users/:userId/profile',
        element: <protectedRoutes.publicProfile.component />,
      },
      {
        path: 'users/:userId/reviews',
        element: <protectedRoutes.userReviews.component />,
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

      // Chat Routes
      {
        path: 'chat',
        children: [
          {
            index: true,
            element: <protectedRoutes.chat.component />,
          },
          {
            path: ':threadId',
            element: <protectedRoutes.chat.component />,
          },
        ],
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
            path: 'email-templates',
            element: <adminRoutes.emailTemplates.component />,
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
