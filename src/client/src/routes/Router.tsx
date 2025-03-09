// src/routes/Router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PrivateRoute from './PrivateRoute';

const HomePage = lazy(() => import('../pages/HomePage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const SkillsPage = lazy(() => import('../pages/skills/SkillsPage'));
const MatchmakingPage = lazy(() => import('../pages/matchmaking/MatchmakingPage'));
const AppointmentsPage = lazy(() => import('../pages/appointments/AppointmentsPage'));
const VideoCallPage = lazy(() => import('../pages/videocall/VideoCallPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Suspense
            fallback={
              <LoadingSpinner fullPage message="Seite wird geladen..." />
            }
          >
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense
            fallback={
              <LoadingSpinner fullPage message="Seite wird geladen..." />
            }
          >
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense
            fallback={
              <LoadingSpinner fullPage message="Seite wird geladen..." />
            }
          >
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <PrivateRoute>
            <Suspense
              fallback={
                <LoadingSpinner fullPage message="Seite wird geladen..." />
              }
            >
              <DashboardPage />
            </Suspense>
          </PrivateRoute>
        ),
      },
      {
        path: 'skills',
        element: (
          <PrivateRoute>
            <Suspense
              fallback={
                <LoadingSpinner fullPage message="Seite wird geladen..." />
              }
            >
              <SkillsPage />
            </Suspense>
          </PrivateRoute>
        ),
      },
      {
        path: 'matchmaking',
        element: (
          <PrivateRoute>
            <Suspense
              fallback={
                <LoadingSpinner fullPage message="Seite wird geladen..." />
              }
            >
              <MatchmakingPage />
            </Suspense>
          </PrivateRoute>
        ),
      },
      {
        path: 'appointments',
        element: (
          <PrivateRoute>
            <Suspense
              fallback={
                <LoadingSpinner fullPage message="Seite wird geladen..." />
              }
            >
              <AppointmentsPage />
            </Suspense>
          </PrivateRoute>
        ),
      },
      {
        path: 'videocall/:appointmentId',
        element: (
          <PrivateRoute>
            <Suspense
              fallback={
                <LoadingSpinner fullPage message="Seite wird geladen..." />
              }
            >
              <VideoCallPage />
            </Suspense>
          </PrivateRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <PrivateRoute>
            <Suspense
              fallback={
                <LoadingSpinner fullPage message="Seite wird geladen..." />
              }
            >
              <ProfilePage />
            </Suspense>
          </PrivateRoute>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense
            fallback={
              <LoadingSpinner fullPage message="Seite wird geladen..." />
            }
          >
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
];

// Erstelle den Router mit den definierten Routen
export const router = createBrowserRouter(routes);
