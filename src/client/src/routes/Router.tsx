// src/routes/Router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PrivateRoute from './PrivateRoute';

// Lazy-loaded Komponentenimports
const HomePage = lazy(() => import('../pages/HomePage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const SkillsPage = lazy(() => import('../pages/skills/SkillsPage'));
const MatchmakingPage = lazy(
  () => import('../pages/matchmaking/MatchmakingPage')
);
const AppointmentsPage = lazy(
  () => import('../pages/appointments/AppointmentsPage')
);
const VideoCallPage = lazy(() => import('../pages/videocall/VideoCallPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Fallback für Lazy-loaded Komponenten
const SuspenseFallback = () => (
  <LoadingSpinner fullPage message="Seite wird geladen..." />
);

// Wrapper-Komponente für Suspense
// Suspense-Komponenten in separate Dateien exportieren
const LazyHomePage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <HomePage />
  </Suspense>
);

const LazyDashboardPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <DashboardPage />
  </Suspense>
);

const LazyLoginPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <LoginPage />
  </Suspense>
);

const LazyRegisterPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <RegisterPage />
  </Suspense>
);

const LazySkillsPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <SkillsPage />
  </Suspense>
);

const LazyMatchmakingPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <MatchmakingPage />
  </Suspense>
);

const LazyAppointmentsPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <AppointmentsPage />
  </Suspense>
);

const LazyVideoCallPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <VideoCallPage />
  </Suspense>
);

const LazyProfilePage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <ProfilePage />
  </Suspense>
);

const LazyNotFoundPage = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <NotFoundPage />
  </Suspense>
);

// Definition aller Routen der Anwendung
const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <LazyHomePage />,
      },
      {
        path: 'login',
        element: <LazyLoginPage />,
      },
      {
        path: 'register',
        element: <LazyRegisterPage />,
      },
      {
        path: 'dashboard',
        element: (
          <PrivateRoute>
            <LazyDashboardPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'skills',
        element: (
          <PrivateRoute>
            <LazySkillsPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'matchmaking',
        element: (
          <PrivateRoute>
            <LazyMatchmakingPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'appointments',
        element: (
          <PrivateRoute>
            <LazyAppointmentsPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'videocall/:appointmentId',
        element: (
          <PrivateRoute>
            <LazyVideoCallPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <PrivateRoute>
            <LazyProfilePage />
          </PrivateRoute>
        ),
      },
      {
        path: '*',
        element: <LazyNotFoundPage />,
      },
    ],
  },
];

// Erstelle den Router mit den definierten Routen
export const router = createBrowserRouter(routes);
