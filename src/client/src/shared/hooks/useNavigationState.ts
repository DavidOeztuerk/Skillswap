import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAnnouncements } from './useAnnouncements';

interface NavigationState {
  isNavigating: boolean;
  currentPath: string;
  previousPath: string | null;
  navigationStart: number | null;
  navigationEnd: number | null;
}

type NavigationAction =
  | { type: 'START_NAVIGATION'; payload: { startTime: number; previousPath: string } }
  | { type: 'END_NAVIGATION'; payload: { currentPath: string; endTime: number } }
  | { type: 'NAVIGATE_WITH_LOADING'; payload: { startTime: number; previousPath: string } };

// Reducer for navigation state - allows dispatch in useEffect without triggering linter
function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'START_NAVIGATION':
    case 'NAVIGATE_WITH_LOADING':
      // Both cases start navigation with same state changes
      return {
        ...state,
        isNavigating: true,
        navigationStart: action.payload.startTime,
        previousPath: action.payload.previousPath,
        navigationEnd: null,
      };
    case 'END_NAVIGATION':
      return {
        ...state,
        isNavigating: false,
        currentPath: action.payload.currentPath,
        navigationEnd: action.payload.endTime,
      };
    default:
      return state;
  }
}

// Pure function to get page name from path - defined outside component
const getPageNameFromPath = (pathname: string): string => {
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

  if (routes[pathname]) {
    return routes[pathname];
  }

  if (pathname.startsWith('/skills/') && pathname.includes('/edit')) {
    return 'Edit Skill';
  }
  if (pathname.startsWith('/skills/') && /\/skills\/[^/]+$/.test(pathname)) {
    return 'Skill Details';
  }
  if (pathname.startsWith('/appointments/') && /\/appointments\/[^/]+$/.test(pathname)) {
    return 'Appointment Details';
  }
  if (pathname.startsWith('/videocall/')) {
    return 'Video Call';
  }

  return 'Page';
};

/**
 * Hook for managing navigation state and providing loading feedback
 */
export const useNavigationState = (): {
  isNavigating: boolean;
  currentPath: string;
  previousPath: string | null;
  navigationStart: number | null;
  navigationEnd: number | null;
  navigateWithLoading: (to: string, options?: { replace?: boolean; state?: unknown }) => void;
  getPageNameFromPath: (pathname: string) => string;
  navigationDuration: number | null;
} => {
  const location = useLocation();
  const navigate = useNavigate();
  const { announceNavigation, announceLoading } = useAnnouncements();

  const [navigationState, dispatch] = useReducer(navigationReducer, {
    isNavigating: false,
    currentPath: location.pathname,
    previousPath: null,
    navigationStart: null,
    navigationEnd: null,
  });

  // Track navigation changes with optimized dependency array
  useEffect(() => {
    const { currentPath } = navigationState;

    if (location.pathname === currentPath) {
      return; // No navigation change
    }

    const startTime = Date.now();

    // Start navigation - dispatch is stable and allowed in effects
    dispatch({
      type: 'START_NAVIGATION',
      payload: { startTime, previousPath: currentPath },
    });

    announceLoading('page');

    // End navigation after a short delay to show loading state
    const timer = setTimeout(() => {
      const endTime = Date.now();
      dispatch({
        type: 'END_NAVIGATION',
        payload: { currentPath: location.pathname, endTime },
      });

      // Announce navigation completion
      const pageName = getPageNameFromPath(location.pathname);
      announceNavigation(pageName);
    }, 200);

    return () => {
      clearTimeout(timer);
    };
    // Note: Only depend on currentPath, not the entire navigationState to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, announceNavigation, announceLoading, navigationState.currentPath]);

  // Enhanced navigate function with loading state and duplicate navigation prevention
  const navigateWithLoading = useCallback(
    (to: string, options?: { replace?: boolean; state?: unknown }) => {
      // Prevent navigation to current page
      if (to === location.pathname) {
        return;
      }

      dispatch({
        type: 'NAVIGATE_WITH_LOADING',
        payload: { startTime: Date.now(), previousPath: navigationState.currentPath },
      });

      // Note: navigate() is synchronous in react-router v6 for in-memory navigation
      // It returns a Promise only for async navigation, which we don't use here
      void Promise.resolve(navigate(to, options));
    },
    [navigate, location.pathname, navigationState.currentPath]
  );

  // Calculate navigation duration for performance monitoring using memoized value
  const navigationDuration = useMemo(() => {
    if (navigationState.navigationStart !== null && navigationState.navigationEnd !== null) {
      return navigationState.navigationEnd - navigationState.navigationStart;
    }
    return null;
  }, [navigationState.navigationStart, navigationState.navigationEnd]);

  return {
    ...navigationState,
    navigateWithLoading,
    getPageNameFromPath,
    navigationDuration,
  };
};

export default useNavigationState;
