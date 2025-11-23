import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import { 
  createLazyRoute, 
  createLazyComponents,
  preloadComponents,
} from '../components/routing/withSuspense';

/**
 * Public Routes - keine Authentifizierung erforderlich
 */
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
    loadingMessage: "Suchergebnisse werden geladen...",
  }),
};

/**
 * Protected Routes - Authentifizierung erforderlich
 */
const protectedRoutes = {
  dashboard: createLazyRoute(() => import('../pages/DashboardPage'), {
    roles: ['*'], // Any authenticated user
    useSkeleton: true,
    skeletonVariant: 'dashboard',
  }),
  
  // Skills Module
  skills: {
    list: createLazyRoute(() => import('../pages/skills/SkillsPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    detail: createLazyRoute(() => import('../pages/skills/SkillDetailPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'details',
    }),
    edit: createLazyRoute(() => import('../pages/skills/SkillEditPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'form',
    }),
  },
  
  // Matchmaking Module
  matchmaking: {
    overview: createLazyRoute(() => import('../pages/matchmaking/MatchmakingOverviewPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    timeline: createLazyRoute(() => import('../pages/matchmaking/MatchRequestTimelinePage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'details',
    }),
    matches: createLazyRoute(() => import('../pages/matchmaking/MatchesPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'list',
      loadingMessage: 'Matches werden geladen...',
    }),
    matchDetail: createLazyRoute(() => import('../pages/matchmaking/MatchDetailPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'details',
      loadingMessage: 'Match-Details werden geladen...',
    }),
  },
  
  // Appointments Module
  appointments: {
    list: createLazyRoute(() => import('../pages/appointments/AppointmentsPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'list',
    }),
    detail: createLazyRoute(() => import('../pages/sessions/SessionDetailPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'details',
      loadingMessage: "Session wird geladen...",
    }),
    calendar: createLazyRoute(() => import('../pages/appointments/AppointmentCalendarPage'), {
      roles: ['*'], // Any authenticated user
      useSkeleton: true,
      skeletonVariant: 'dashboard',
      loadingMessage: "Kalender wird geladen...",
    }),
  },
  
  // Video Call - High Priority
  videoCall: createLazyRoute(() => import('../pages/videocall/VideoCallPage'), {
    roles: ['*'], // Any authenticated user
    useSkeleton: false,
    loadingMessage: "Video-Call wird initialisiert...",
  }),
  
  // User Profile & Settings
  profile: createLazyRoute(() => import('../pages/profile/ProfilePage'), {
    roles: ['*'], // Any authenticated user
    useSkeleton: true,
    skeletonVariant: 'profile',
  }),
  
  securitySettings: createLazyRoute(() => import('../pages/settings/SecuritySettings'), {
    roles: ['*'], // Any authenticated user
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'Sicherheitseinstellungen werden geladen...',
  }),

  notificationPreferences: createLazyRoute(() => import('../pages/settings/NotificationPreferencesPage'), {
    roles: ['*'], // Any authenticated user
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: 'Benachrichtigungseinstellungen werden geladen...',
  }),

  notifications: createLazyRoute(() => import('../pages/notifications/NotificationsPage'), {
    roles: ['*'], // Any authenticated user
    useSkeleton: true,
    skeletonVariant: 'list',
  }),
};

/**
 * Admin Routes - mit role: 'admin'
 */
const adminRoutes = {
  dashboard: createLazyRoute(() => import('../pages/admin/Dashboard'), {
    permissions: ['admin:access_dashboard'],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: "Admin-Dashboard wird geladen...",
  }),
  
  users: createLazyRoute(() => import('../pages/admin/UserManagement'), {
    permissions: ['users:view_all'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Benutzer werden geladen...",
  }),
  
  skills: createLazyRoute(() => import('../pages/admin/AdminSkillsPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Skills werden geladen...",
  }),
  
  appointments: createLazyRoute(() => import('../pages/admin/AdminAppointmentsPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Termine werden geladen...",
  }),
  
  matches: createLazyRoute(() => import('../pages/admin/AdminMatchesPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Matches werden geladen...",
  }),
  
  analytics: createLazyRoute(() => import('../pages/admin/AdminAnalyticsPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: "Analytics werden geladen...",
  }),
  
  systemHealth: createLazyRoute(() => import('../pages/admin/AdminSystemHealthPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'dashboard',
    loadingMessage: "System-Status wird geladen...",
  }),
  
  auditLogs: createLazyRoute(() => import('../pages/admin/AdminAuditLogsPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Audit-Logs werden geladen...",
  }),
  
  moderation: createLazyRoute(() => import('../pages/admin/AdminModerationPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Moderations-Berichte werden geladen...",
  }),
  
  settings: createLazyRoute(() => import('../pages/admin/AdminSettingsPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'form',
    loadingMessage: "Einstellungen werden geladen...",
  }),
  
  metrics: createLazyRoute(() => import('../pages/admin/AdminMetricsPage'), {
    roles: ['Admin', 'SuperAdmin'],
    useSkeleton: true,
    skeletonVariant: 'list',
  }),
  
  skillCategories: createLazyRoute(() => import('../pages/admin/SkillCategoriesManagement'), {
    permissions: ['skills:manage_categories'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Skill-Kategorien werden geladen...",
  }),
  
  proficiencyLevels: createLazyRoute(() => import('../pages/admin/ProficiencyLevelsManagement'), {
    permissions: ['skills:manage_proficiency'],
    useSkeleton: true,
    skeletonVariant: 'list',
    loadingMessage: "Proficiency Levels werden geladen...",
  }),
};

/**
 * Error Pages
 */
const errorPages = createLazyComponents({
  notFound: () => import('../pages/NotFoundPage'),
  forbidden: () => import('../pages/ForbiddenPage'),
  unauthorized: () => import('../pages/UnauthorizedPage'),
}, {
  useSkeleton: false,
  withErrorBoundary: false,
});

/**
 * Preloading-Strategien
 */
export const preloadStrategies = {
  critical: async () => {
    await preloadComponents([
      publicRoutes.home,
      protectedRoutes.dashboard,
    ]);
  },
  
  authFlow: async () => {
    await preloadComponents([
      publicRoutes.login,
      publicRoutes.register,
      protectedRoutes.dashboard,
    ]);
  },
  
  mainFeatures: async () => {
    await preloadComponents([
      protectedRoutes.skills.list,
      protectedRoutes.matchmaking.overview,
      protectedRoutes.appointments.list,
    ]);
  },
  
  adminArea: async () => {
    await preloadComponents([
      adminRoutes.dashboard,
      adminRoutes.users,
      adminRoutes.analytics,
    ]);
  },
};

/**
 * Skills-Komponente Wrapper für verschiedene showOnly Props
 */
const SkillsPageAll = () => {
  const Component = protectedRoutes.skills.list.component;
  return <Component showOnly="all" />;
};

const SkillsPageMine = () => {
  const Component = protectedRoutes.skills.list.component;
  return <Component showOnly="mine" />;
};

const SkillsPageFavorite = () => {
  const Component = protectedRoutes.skills.list.component;
  return <Component showOnly="favorite" />;
};

/**
 * Route-Konfiguration
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      // Public Routes
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
      
      // Protected Routes
      {
        path: 'dashboard',
        element: <protectedRoutes.dashboard.component />
      },
      
      // Skills Routes
      {
        path: 'skills',
        children: [
          {
            index: true,
            element: <SkillsPageAll />
          },
          {
            path: 'my-skills',
            element: <SkillsPageMine />
          },
          {
            path: 'favorites',
            element: <SkillsPageFavorite />
          },
          {
            path: ':skillId',
            element:  <protectedRoutes.skills.detail.component />
          },
          {
            path: ':skillId/edit',
            element: <protectedRoutes.skills.edit.component />
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
      
      // Admin Routes
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
        ],
      },
      
      // Error Pages
      {
        path: 'forbidden',
        element: <errorPages.forbidden />,
      },
      {
        path: 'unauthorized',
        element: <errorPages.unauthorized />,
      },
      {
        path: '*',
        element: <errorPages.notFound />,
      },
    ],
  },
];

// Router erstellen
export const router = createBrowserRouter(routes);

// Hook für Route-Preloading
export const useRoutePreloading = () => {
  const preloadRoute = (routeName: string) => {
    const allRoutes: Record<string, any> = {
      ...publicRoutes,
      ...protectedRoutes,
      ...adminRoutes,
      'skills.list': protectedRoutes.skills.list,
      'skills.detail': protectedRoutes.skills.detail,
      'skills.edit': protectedRoutes.skills.edit,
      'matchmaking.overview': protectedRoutes.matchmaking.overview,
      'matchmaking.timeline': protectedRoutes.matchmaking.timeline,
      'appointments.list': protectedRoutes.appointments.list,
      'appointments.detail': protectedRoutes.appointments.detail,
    };
    
    const route = allRoutes[routeName];
    if (route && 'preload' in route) {
      route.preload();
    }
  };
  
  const preloadStrategy = (strategy: keyof typeof preloadStrategies) => {
    preloadStrategies[strategy]();
  };
  
  return { preloadRoute, preloadStrategy };
};

// Export für Navigation
export const routeConfig = {
  public: publicRoutes,
  protected: protectedRoutes,
  admin: adminRoutes,
  error: errorPages,
} as const;

// DISABLED - Initiales Preloading causing potential infinite loops
// if (typeof window !== 'undefined') {
//   setTimeout(() => {
//     preloadStrategies.critical();
//   }, 1000);
// }