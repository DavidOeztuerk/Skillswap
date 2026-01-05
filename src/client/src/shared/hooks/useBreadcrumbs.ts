import { useMemo } from 'react';
import { type Params, useLocation, useParams } from 'react-router-dom';
import { withDefault } from '../utils/safeAccess';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

// Constant for commonly used parent path
const PATH_DASHBOARD = '/dashboard';

type BreadcrumbConfig = Record<
  string,
  {
    label: string;
    parent?: string;
    isDynamic?: boolean;
    labelResolver?: (params: Readonly<Params>) => string;
  }
>;

/**
 * Hook for automatic breadcrumb generation based on current route
 */
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();
  const params = useParams();

  // Define breadcrumb configuration
  const breadcrumbConfig: BreadcrumbConfig = useMemo(
    () => ({
      '/': {
        label: 'Home',
      },
      [PATH_DASHBOARD]: {
        label: 'Dashboard',
        parent: '/',
      },
      '/skills': {
        label: 'Skills',
        parent: PATH_DASHBOARD,
      },
      '/skills/my-skills': {
        label: 'Meine Skills',
        parent: '/skills',
      },
      '/skills/favorites': {
        label: 'Favoriten',
        parent: '/skills',
      },
      '/skills/:skillId': {
        label: 'Skill Details',
        parent: '/skills',
        isDynamic: true,
        labelResolver: () => 'Skill Details', // Could be enhanced with skill name
      },
      '/skills/:skillId/edit': {
        label: 'Skill bearbeiten',
        parent: '/skills/:skillId',
        isDynamic: true,
        labelResolver: () => 'Bearbeiten',
      },
      '/matchmaking': {
        label: 'Matching',
        parent: PATH_DASHBOARD,
      },
      '/appointments': {
        label: 'Termine',
        parent: PATH_DASHBOARD,
      },
      '/appointments/:appointmentId': {
        label: 'Termin Details',
        parent: '/appointments',
        isDynamic: true,
        labelResolver: () => 'Termin Details',
      },
      '/videocall/:appointmentId': {
        label: 'Video Call',
        parent: '/appointments/:appointmentId',
        isDynamic: true,
        labelResolver: () => 'Video Call',
      },
      '/profile': {
        label: 'Profil',
        parent: PATH_DASHBOARD,
      },
      '/search': {
        label: 'Suche',
        parent: '/',
      },
      '/users/:userId': {
        label: 'Benutzerprofil',
        parent: '/search',
        isDynamic: true,
        labelResolver: () => 'Benutzerprofil',
      },
      '/users/:userId/profile': {
        label: 'Profil',
        parent: '/users/:userId',
        isDynamic: true,
        labelResolver: () => 'Profil',
      },
      '/users/:userId/reviews': {
        label: 'Bewertungen',
        parent: '/users/:userId/profile',
        isDynamic: true,
        labelResolver: () => 'Bewertungen',
      },
      // Matchmaking detail route
      '/matchmaking/:matchId': {
        label: 'Match Details',
        parent: '/matchmaking',
        isDynamic: true,
        labelResolver: () => 'Match Details',
      },
      // Session detail route
      '/sessions/:sessionId': {
        label: 'Session Details',
        parent: '/appointments',
        isDynamic: true,
        labelResolver: () => 'Session Details',
      },
      // Settings routes
      '/settings': {
        label: 'Einstellungen',
        parent: PATH_DASHBOARD,
      },
      '/settings/security': {
        label: 'Sicherheit',
        parent: '/settings',
      },
      '/settings/notifications': {
        label: 'Benachrichtigungen',
        parent: '/settings',
      },
      '/settings/profile': {
        label: 'Profil',
        parent: '/settings',
      },
    }),
    []
  );

  // Generate breadcrumbs based on current path
  return useMemo((): BreadcrumbItem[] => {
    const currentPath = location.pathname;
    const breadcrumbChain: BreadcrumbItem[] = [];

    // Find matching route configuration
    const findMatchingConfig = (
      path: string
    ): {
      path: string;
      config: {
        label: string;
        parent?: string;
        isDynamic?: boolean;
        labelResolver?: (params: Readonly<Params>) => string;
      };
    } | null => {
      // Try exact match first (check if path exists in config)
      const exactMatch = breadcrumbConfig[path] as
        | {
            label: string;
            parent?: string;
            isDynamic?: boolean;
            labelResolver?: (params: Readonly<Params>) => string;
          }
        | undefined;
      if (exactMatch !== undefined && exactMatch.isDynamic !== true) {
        return { path, config: exactMatch };
      }

      // Try dynamic route matching
      for (const [configPath, config] of Object.entries(breadcrumbConfig)) {
        if (config.isDynamic) {
          const regex = new RegExp(`^${configPath.replaceAll(/:[^/]+/g, '[^/]+')}$`);
          if (regex.test(path)) {
            return { path: configPath, config };
          }
        }
      }
      return null;
    };

    // Build breadcrumb chain recursively
    const buildChain = (path: string): BreadcrumbItem[] => {
      const match = findMatchingConfig(path);
      if (!match) return [];

      const { config } = match;
      const chain: BreadcrumbItem[] = [];

      // Add parent breadcrumbs first
      if (config.parent) {
        chain.push(...buildChain(config.parent));
      }

      // Add current breadcrumb
      const label = config.labelResolver ? config.labelResolver(params) : config.label;

      chain.push({
        label,
        href: path === currentPath ? undefined : path,
        isActive: path === currentPath,
      });

      return chain;
    };

    const chain = buildChain(currentPath);

    // If no configuration found, create basic breadcrumbs from path segments
    if (chain.length === 0) {
      const segments = currentPath.split('/').filter(Boolean);

      // Always start with home
      breadcrumbChain.push({
        label: 'Home',
        href: currentPath === '/' ? undefined : '/',
        isActive: currentPath === '/',
      });

      // Add path segments
      let builtPath = '';
      segments.forEach((segment, index) => {
        const safeSegment = segment;
        builtPath += `/${safeSegment}`;
        const isLast = index === segments.length - 1;

        breadcrumbChain.push({
          label: safeSegment.charAt(0).toUpperCase() + safeSegment.slice(1),
          href: isLast ? undefined : builtPath,
          isActive: isLast,
        });
      });

      return breadcrumbChain;
    }

    return chain;
  }, [location.pathname, params, breadcrumbConfig]);
};

/**
 * Hook for getting the current page title
 */
export const usePageTitle = (): string => {
  const breadcrumbs = useBreadcrumbs();
  const activeBreadcrumb = breadcrumbs.find((b) => b.isActive === true);
  return withDefault(activeBreadcrumb?.label, 'Page');
};

export default useBreadcrumbs;
