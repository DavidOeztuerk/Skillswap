// src/hooks/useRouteAnnouncements.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnnouncements } from './useAnnouncements';

/**
 * Hook for announcing route changes to screen readers
 */
export const useRouteAnnouncements = () => {
  const location = useLocation();
  const { announceNavigation } = useAnnouncements();

  // Helper function defined before use
  const getPageName = (pathname: string): string => {
    const routes: Record<string, string> = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/skills': 'Skills',
      '/skills/my-skills': 'My Skills',
      '/skills/favorites': 'Favorite Skills',
      '/matchmaking': 'Matchmaking',
      '/appointments': 'Appointments',
      '/profile': 'Profile',
      '/search': 'Search',
      '/login': 'Login',
      '/register': 'Registration',
      '/forgot-password': 'Forgot Password',
      '/reset-password': 'Reset Password',
      '/forbidden': 'Access Forbidden',
    };

    // Check for exact matches first
    if (routes[pathname]) {
      return routes[pathname];
    }

    // Check for dynamic routes
    if (pathname.startsWith('/skills/') && pathname.includes('/edit')) {
      return 'Edit Skill';
    }
    if (pathname.startsWith('/skills/') && pathname.match(/\/skills\/[^/]+$/)) {
      return 'Skill Details';
    }
    if (pathname.startsWith('/appointments/') && pathname.match(/\/appointments\/[^/]+$/)) {
      return 'Appointment Details';
    }
    if (pathname.startsWith('/videocall/')) {
      return 'Video Call';
    }
    if (pathname.startsWith('/users/')) {
      return 'User Profile';
    }

    // Fallback to a generic page name
    const segments = pathname.split('/').filter(Boolean);
    if (segments?.length > 0) {
      return segments[segments?.length - 1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return 'Page';
  };

  useEffect(() => {
    // Update document title
    const pageName = getPageName(location.pathname);
    document.title = `${pageName} - SkillSwap`;

    // Announce navigation to screen readers with a delay
    // to ensure the page content has loaded
    const announceTimer = setTimeout(() => {
      announceNavigation(pageName);
    }, 500);

    return () => {
      clearTimeout(announceTimer);
    };
  }, [location.pathname, announceNavigation, getPageName]);

  return {
    currentPath: location.pathname,
    currentPageName: getPageName(location.pathname),
    getPageName,
  };
};

export default useRouteAnnouncements;