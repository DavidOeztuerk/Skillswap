// src/routes/Router.tsx
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import { withSuspense, withPrivateRoute } from '../components/routing/withSuspense';

// Public Pages with optimized loading
const HomePage = withSuspense(() => import('../pages/HomePage'), {
  useSkeleton: true,
  skeletonVariant: 'dashboard',
});

// Auth Pages with form optimizations
const LoginPage = withSuspense(() => import('../pages/auth/LoginPage'), {
  useSkeleton: true,
  skeletonVariant: 'form',
});
const RegisterPage = withSuspense(() => import('../pages/auth/RegisterPage'), {
  useSkeleton: true,
  skeletonVariant: 'form',
});

// Dashboard with priority loading
const DashboardPage = withPrivateRoute(() => import('../pages/DashboardPage'), {
  useSkeleton: true,
  skeletonVariant: 'dashboard'
});

// Core Feature Pages with optimized loading
const SkillsPage = withPrivateRoute(() => import('../pages/skills/SkillsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
});
const SkillDetailPage = withPrivateRoute(() => import('../pages/skills/SkillDetailPage'), {
  useSkeleton: true,
  skeletonVariant: 'details',
});
const SkillEditPage = withPrivateRoute(() => import('../pages/skills/SkillEditPage'), {
  useSkeleton: true,
  skeletonVariant: 'form',
});

// Matchmaking with real-time data
const MatchmakingOverviewPage = withPrivateRoute(() => import('../pages/matchmaking/MatchmakingOverviewPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
});

// MatchRequestsOverviewPage ist jetzt in MatchmakingOverviewPage eingebettet
// const MatchRequestsOverviewPage = withPrivateRoute(
//   () => import('../pages/matchmaking/MatchRequestsOverviewPage'),
//   {
//     useSkeleton: true,
//     skeletonVariant: 'list',
//   }
// );

const MatchRequestTimelinePage = withPrivateRoute(
  () => import('../pages/matchmaking/MatchRequestTimelinePage'),
  {
    useSkeleton: true,
    skeletonVariant: 'details',
  }
);

// Appointments with scheduling focus
const AppointmentsPage = withPrivateRoute(() => import('../pages/appointments/AppointmentsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
});
const AppointmentDetailPage = withPrivateRoute(() => import('../pages/appointments/AppointmentDetailPage'), {
  useSkeleton: true,
  skeletonVariant: 'details',
  loadingMessage: "Termin wird geladen...",
});

// Video Call with high priority
const VideoCallPage = withPrivateRoute(() => import('../pages/videocall/EnhancedVideoCallPage'), {
  useSkeleton: false, // No skeleton for video calls
  loadingMessage: "Video-Call wird initialisiert..."
});

// Profile and Settings
const ProfilePage = withPrivateRoute(() => import('../pages/profile/ProfilePage'), {
  useSkeleton: true,
  skeletonVariant: 'profile',
});

// Notifications Page
const NotificationsPage = withPrivateRoute(() => import('../pages/notifications/NotificationsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
});

// Search and Discovery
const SearchResultsPage = withSuspense(() => import('../pages/search/SearchResultsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Suchergebnisse werden geladen...",
});

// Error Pages - lightweight loading
const NotFoundPage = withSuspense(() => import('../pages/NotFoundPage'), {
});
const ForbiddenPage = withSuspense(() => import('../pages/ForbiddenPage'), {
});
const UnauthorizedPage = withSuspense(() => import('../pages/UnauthorizedPage'), {
});

// Admin Pages with optimized loading and role-based access
const AdminDashboardPage = withPrivateRoute(() => import('../pages/admin/AdminDashboardPage'), {
  useSkeleton: true,
  skeletonVariant: 'dashboard',
  loadingMessage: "Admin-Dashboard wird geladen...",
  requiredRole: 'admin',
});
const AdminUsersPage = withPrivateRoute(() => import('../pages/admin/AdminUsersPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Benutzer werden geladen...",
  requiredRole: 'admin',
});
const AdminSkillsPage = withPrivateRoute(() => import('../pages/admin/AdminSkillsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Skills werden geladen...",
  requiredRole: 'admin',
});
const AdminAppointmentsPage = withPrivateRoute(() => import('../pages/admin/AdminAppointmentsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Termine werden geladen...",
  requiredRole: 'admin',
});
const AdminMatchesPage = withPrivateRoute(() => import('../pages/admin/AdminMatchesPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Matches werden geladen...",
  requiredRole: 'admin',
});
const AdminAnalyticsPage = withPrivateRoute(() => import('../pages/admin/AdminAnalyticsPage'), {
  useSkeleton: true,
  skeletonVariant: 'dashboard',
  loadingMessage: "Analytics werden geladen...",
  requiredRole: 'admin',
});
const AdminSystemHealthPage = withPrivateRoute(() => import('../pages/admin/AdminSystemHealthPage'), {
  useSkeleton: true,
  skeletonVariant: 'dashboard',
  loadingMessage: "System-Status wird geladen...",
  requiredRole: 'admin',
});
const AdminAuditLogsPage = withPrivateRoute(() => import('../pages/admin/AdminAuditLogsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Audit-Logs werden geladen...",
  requiredRole: 'admin',
});
const AdminModerationPage = withPrivateRoute(() => import('../pages/admin/AdminModerationPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Moderations-Berichte werden geladen...",
  requiredRole: 'admin',
});
const AdminSettingsPage = withPrivateRoute(() => import('../pages/admin/AdminSettingsPage'), {
  useSkeleton: true,
  skeletonVariant: 'form',
  loadingMessage: "Einstellungen werden geladen...",
  requiredRole: 'admin',
});
const AdminMetricsPage = withPrivateRoute(() => import('../pages/admin/AdminMetricsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list'
});

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'skills',
        element: <SkillsPage showOnly="all" />,
      },
      {
        path: 'skills/my-skills',
        element: <SkillsPage showOnly="mine" />,
      },
      {
        path: 'skills/favorites',
        element: <SkillsPage showOnly="favorite" />,
      },
      {
        path: 'skills/:skillId/edit',
        element: <SkillEditPage />,
      },
      {
        path: 'skills/:skillId',
        element: <SkillDetailPage />,
      },
      {
        path: 'matchmaking',
        element: <MatchmakingOverviewPage />,
      },
      {
        path: 'matchmaking/timeline/:threadId',
        element: <MatchRequestTimelinePage />,
      },
      {
        path: 'appointments',
        element: <AppointmentsPage />,
      },
      {
        path: 'videocall/:appointmentId',
        element: <VideoCallPage />,
      },
      {
        path: 'admin/metrics',
        element: <AdminMetricsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'appointments/:appointmentId',
        element: <AppointmentDetailPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'search',
        element: <SearchResultsPage />,
      },
      // Admin Routes
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'users',
            element: <AdminUsersPage />,
          },
          {
            path: 'skills',
            element: <AdminSkillsPage />,
          },
          {
            path: 'appointments',
            element: <AdminAppointmentsPage />,
          },
          {
            path: 'matches',
            element: <AdminMatchesPage />,
          },
          {
            path: 'analytics',
            element: <AdminAnalyticsPage />,
          },
          {
            path: 'system-health',
            element: <AdminSystemHealthPage />,
          },
          {
            path: 'audit-logs',
            element: <AdminAuditLogsPage />,
          },
          {
            path: 'moderation',
            element: <AdminModerationPage />,
          },
          {
            path: 'settings',
            element: <AdminSettingsPage />,
          },
        ],
      },
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

// Erstelle den Router mit den definierten Routen
export const router = createBrowserRouter(routes);
