// src/routes/Router.tsx
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import { withSuspense, withPrivateRoute } from '../components/routing/withSuspense';

const HomePage = withSuspense(() => import('../pages/HomePage'), {
  useSkeleton: true,
  skeletonVariant: 'dashboard'
});
const DashboardPage = withPrivateRoute(() => import('../pages/DashboardPage'), {
  useSkeleton: true,
  skeletonVariant: 'dashboard'
});
const LoginPage = withSuspense(() => import('../pages/auth/LoginPage'), {
  useSkeleton: true,
  skeletonVariant: 'form'
});
const RegisterPage = withSuspense(() => import('../pages/auth/RegisterPage'), {
  useSkeleton: true,
  skeletonVariant: 'form'
});
const SkillsPage = withPrivateRoute(() => import('../pages/skills/SkillsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list'
});
const SkillDetailPage = withPrivateRoute(() => import('../pages/skills/SkillDetailPage'), {
  useSkeleton: true,
  skeletonVariant: 'details'
});
const SkillEditPage = withPrivateRoute(() => import('../pages/skills/SkillEditPage'), {
  useSkeleton: true,
  skeletonVariant: 'form'
});
const MatchmakingPage = withPrivateRoute(() => import('../pages/matchmaking/MatchmakingPage'), {
  useSkeleton: true,
  skeletonVariant: 'list'
});
const AppointmentsPage = withPrivateRoute(() => import('../pages/appointments/AppointmentsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list'
});
const AppointmentDetailPage = withPrivateRoute(() => import('../pages/appointments/AppointmentDetailPage'), {
  useSkeleton: true,
  skeletonVariant: 'details',
  loadingMessage: "Loading appointment..."
});
const VideoCallPage = withPrivateRoute(() => import('../pages/videocall/VideoCallPage'), {
  useSkeleton: true,
  skeletonVariant: 'details'
});
const ProfilePage = withPrivateRoute(() => import('../pages/profile/ProfilePage'), {
  useSkeleton: true,
  skeletonVariant: 'profile'
});
const NotFoundPage = withSuspense(() => import('../pages/NotFoundPage'));
const ForbiddenPage = withSuspense(() => import('../pages/ForbiddenPage'));
const UnauthorizedPage = withSuspense(() => import('../pages/UnauthorizedPage'));
const SearchResultsPage = withSuspense(() => import('../pages/search/SearchResultsPage'), {
  useSkeleton: true,
  skeletonVariant: 'list',
  loadingMessage: "Loading search..."
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
        element: <MatchmakingPage />,
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
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'appointments/:appointmentId',
        element: <AppointmentDetailPage />,
      },
      {
        path: 'search',
        element: <SearchResultsPage />,
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
