import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAnnouncements } from './useAnnouncements';
import { withDefault, ensureString } from '../utils/safeAccess';

interface NavigationState {
  isNavigating: boolean;
  currentPath: string;
  previousPath: string | null;
  navigationStart: number | null;
}

/**
 * Hook for managing navigation state and providing loading feedback
 */
export const useNavigationState = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { announceNavigation, announceLoading } = useAnnouncements();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    currentPath: location.pathname,
    previousPath: null,
    navigationStart: null,
  });

  // Track navigation changes with optimized dependency array
  useEffect(() => {
    const currentPath = navigationState.currentPath;
    
    if (location.pathname === currentPath) {
      return; // No navigation change
    }

    // Start navigation
    setNavigationState(prev => ({
      ...prev,
      isNavigating: true,
      navigationStart: Date.now(),
      previousPath: prev.currentPath,
    }));
    
    announceLoading('page');

    // End navigation after a short delay to show loading state
    const timer = setTimeout(() => {
      setNavigationState(prev => ({
        ...prev,
        isNavigating: false,
        currentPath: location.pathname,
        navigationStart: null,
      }));
      
      // Announce navigation completion
      const pageName = getPageNameFromPath(location.pathname);
      announceNavigation(pageName);
    }, 200);

    return () => clearTimeout(timer);
  }, [location.pathname, announceNavigation, announceLoading]);

  // Enhanced navigate function with loading state and duplicate navigation prevention
  const navigateWithLoading = useCallback((to: string, options?: any) => {
    // Prevent navigation to current page
    if (to === location.pathname) {
      return;
    }
    
    setNavigationState(prev => ({
      ...prev,
      isNavigating: true,
      navigationStart: Date.now(),
      previousPath: prev.currentPath,
    }));
    
    navigate(to, options);
  }, [navigate, location.pathname]);

  // Get page name from path
  const getPageNameFromPath = (pathname: string): string => {
    const safePath = ensureString(pathname);
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
    };

    if (routes[safePath]) {
      return routes[safePath];
    }

    if (safePath.startsWith('/skills/') && safePath.includes('/edit')) {
      return 'Edit Skill';
    }
    if (safePath.startsWith('/skills/') && safePath.match(/\/skills\/[^/]+$/)) {
      return 'Skill Details';
    }
    if (safePath.startsWith('/appointments/') && safePath.match(/\/appointments\/[^/]+$/)) {
      return 'Appointment Details';
    }
    if (safePath.startsWith('/videocall/')) {
      return 'Video Call';
    }

    return 'Page';
  };

  // Calculate navigation duration for performance monitoring
  const navigationDuration = navigationState.navigationStart 
    ? Date.now() - withDefault(navigationState.navigationStart, Date.now()) 
    : null;

  return {
    ...navigationState,
    navigateWithLoading,
    getPageNameFromPath,
    navigationDuration,
  };
};

export default useNavigationState;