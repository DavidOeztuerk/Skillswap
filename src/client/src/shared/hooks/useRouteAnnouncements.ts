import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnnouncements } from './useAnnouncements';

interface RouteAnnouncementsReturn {
  currentPath: string;
  currentPageName: string;
  getPageName: (pathname: string) => string;
}

/**
 * Hook for announcing route changes to screen readers
 */
export const useRouteAnnouncements = (): RouteAnnouncementsReturn => {
  const location = useLocation();
  const { announceNavigation } = useAnnouncements();

  // Helper function wrapped in useCallback
  const getPageName = useCallback((pathname: string): string => {
    const safePath = pathname;
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
      '/auth/login': 'Login',
      '/auth/register': 'Registration',
      '/forgot-password': 'Forgot Password',
      '/reset-password': 'Reset Password',
      '/forbidden': 'Access Forbidden',
    };

    // Check for exact matches first
    if (routes[safePath]) {
      return routes[safePath];
    }

    // Check for dynamic routes
    if (safePath.startsWith('/skills/') && safePath.includes('/edit')) {
      return 'Edit Skill';
    }
    if (safePath.startsWith('/skills/') && /\/skills\/[^/]+$/.test(safePath)) {
      return 'Skill Details';
    }
    if (safePath.startsWith('/appointments/') && /\/appointments\/[^/]+$/.test(safePath)) {
      return 'Appointment Details';
    }
    if (safePath.startsWith('/videocall/')) {
      return 'Video Call';
    }
    if (safePath.startsWith('/users/')) {
      return 'User Profile';
    }

    // Fallback to a generic page name from path segments
    const segments: string[] = safePath.split('/').filter(Boolean);
    const lastIndex = segments.length - 1;
    if (lastIndex >= 0) {
      const lastSegment: string = segments[lastIndex];
      const words: string[] = lastSegment.split('-');
      const capitalizedWords: string[] = words.map(
        (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
      );
      return capitalizedWords.join(' ');
    }

    return 'Page';
  }, []);

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
