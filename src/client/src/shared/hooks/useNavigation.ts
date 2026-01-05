/**
 * useNavigation Hook
 */

import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBreadcrumbs, usePageTitle, type BreadcrumbItem } from './useBreadcrumbs';
import { useNavigationState } from './useNavigationState';

// ============================================================================
// Types
// ============================================================================

/**
 * Navigationsquellen - woher der User kam
 */
export type NavigationSource =
  | 'home'
  | 'skills'
  | 'mySkills'
  | 'favorites'
  | 'profile'
  | 'search'
  | 'dashboard'
  | 'skill'
  | 'matchmaking'
  | 'appointments';

/**
 * Navigationskontext der via location.state übergeben wird
 */
export interface NavigationContext {
  from?: NavigationSource;
  // Zusätzliche Kontext-Daten für spezifische Navigationen
  skillId?: string;
  skillName?: string;
  userId?: string;
  userName?: string;
  searchQuery?: string;
}

// Re-export für einfachen Import
export type { BreadcrumbItem };

// ============================================================================
// Constants
// ============================================================================

/**
 * Mapping von NavigationSource zu Breadcrumb-Pfad und Label
 */
const SOURCE_TO_BREADCRUMB: Record<NavigationSource, { path: string; label: string }> = {
  home: { path: '/', label: 'Startseite' },
  skills: { path: '/skills', label: 'Alle Skills' },
  mySkills: { path: '/skills/my-skills', label: 'Meine Skills' },
  favorites: { path: '/skills/favorites', label: 'Favoriten' },
  profile: { path: '/profile', label: 'Profil' },
  search: { path: '/search', label: 'Suche' },
  dashboard: { path: '/dashboard', label: 'Dashboard' },
  skill: { path: '/skills', label: 'Skill' },
  matchmaking: { path: '/matchmaking', label: 'Matching' },
  appointments: { path: '/appointments', label: 'Termine' },
};

// ============================================================================
// Hook
// ============================================================================

export interface UseNavigationReturn {
  // Von useNavigationState
  isNavigating: boolean;
  currentPath: string;
  previousPath: string | null;
  navigationDuration: number | null;
  navigateWithLoading: (to: string, options?: { replace?: boolean; state?: unknown }) => void;

  // Von useBreadcrumbs
  breadcrumbs: BreadcrumbItem[];
  pageTitle: string;

  // NEU: Navigation Context (from location.state)
  navigationContext: NavigationContext;

  // NEU: Kontextbasierte Breadcrumbs (überschreibt breadcrumbs wenn Kontext vorhanden)
  contextualBreadcrumbs: BreadcrumbItem[];

  // NEU: Navigation Helper Functions
  navigateWithContext: (
    to: string,
    context?: NavigationContext,
    options?: { replace?: boolean }
  ) => Promise<void>;
  navigateBack: () => void;
  navigateToSkill: (skillId: string, context?: Partial<NavigationContext>) => Promise<void>;
  navigateToProfile: (userId: string, context?: Partial<NavigationContext>) => Promise<void>;

  // NEU: Helper um Source zu bestimmen
  getSourceFromPath: () => NavigationSource;
}

export const useNavigation = (): UseNavigationReturn => {
  const location = useLocation();
  const navigate = useNavigate();

  // Bestehende Hooks nutzen
  const navigationState = useNavigationState();
  const staticBreadcrumbs = useBreadcrumbs();
  const pageTitle = usePageTitle();

  // Navigation Context aus location.state extrahieren
  const navigationContext = useMemo<NavigationContext>(() => {
    const state = location.state as NavigationContext | null;
    return state ?? {};
  }, [location.state]);

  // Source basierend auf aktuellem Pfad bestimmen
  const getSourceFromPath = useCallback((): NavigationSource => {
    const path = location.pathname;

    if (path === '/') return 'home';
    if (path === '/skills/my-skills') return 'mySkills';
    if (path === '/skills/favorites') return 'favorites';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/search') return 'search';
    if (path === '/profile') return 'profile';
    if (path === '/matchmaking') return 'matchmaking';
    if (path === '/appointments') return 'appointments';
    if (/^\/skills\/[^/]+$/.test(path)) return 'skill';
    if (path.startsWith('/users/')) return 'profile';
    if (path.startsWith('/skills')) return 'skills';

    return 'home';
  }, [location.pathname]);

  // Kontextbasierte Breadcrumbs - ersetzt statische wenn Kontext vorhanden
  const contextualBreadcrumbs = useMemo((): BreadcrumbItem[] => {
    const { from, skillId, skillName, userId, userName } = navigationContext;

    // Wenn kein Kontext, nutze statische Breadcrumbs
    if (!from) {
      return staticBreadcrumbs;
    }

    const items: BreadcrumbItem[] = [];

    // Kontextuelle Quelle hinzufügen basierend auf 'from'
    switch (from) {
      case 'home':
        // Kam von Startseite - zeige: Startseite > [aktuelle Seite]
        items.push({ label: 'Startseite', href: '/' });
        break;

      case 'skill':
        // Kam von einem Skill - zeige: Startseite > Skill Name > [aktuelle Seite]
        items.push({ label: 'Startseite', href: '/' });
        if (skillId) {
          items.push({
            label: skillName ?? 'Skill',
            href: `/skills/${skillId}`,
          });
        }
        break;

      case 'skills':
        // Kam von Alle Skills - zeige: Startseite > Alle Skills > [aktuelle Seite]
        items.push({ label: 'Startseite', href: '/' });
        items.push({ label: 'Alle Skills', href: '/skills' });
        break;

      case 'mySkills':
        // Kam von Meine Skills - zeige: Startseite > Meine Skills > [aktuelle Seite]
        items.push({ label: 'Startseite', href: '/' });
        items.push({ label: 'Meine Skills', href: '/skills/my-skills' });
        break;

      case 'favorites':
        // Kam von Favoriten - zeige: Startseite > Favoriten > [aktuelle Seite]
        items.push({ label: 'Startseite', href: '/' });
        items.push({ label: 'Favoriten', href: '/skills/favorites' });
        break;

      case 'profile':
        // Kam von einem Profil - WICHTIG: Skill-Kontext beibehalten wenn vorhanden!
        items.push({ label: 'Startseite', href: '/' });
        // Wenn wir über einen Skill zum Profil gekommen sind, Skill auch anzeigen
        if (skillId) {
          items.push({
            label: skillName ?? 'Skill',
            href: `/skills/${skillId}`,
          });
        }
        // Profil-Link hinzufügen
        if (userId) {
          items.push({
            label: userName ?? 'Profil',
            href: `/users/${userId}/profile`,
          });
        }
        break;

      case 'search':
        items.push({ label: 'Startseite', href: '/' });
        items.push({ label: 'Suche', href: '/search' });
        break;

      case 'dashboard':
        items.push({ label: 'Startseite', href: '/' });
        items.push({ label: 'Dashboard', href: '/dashboard' });
        break;

      case 'matchmaking':
        items.push({ label: 'Startseite', href: '/' });
        items.push({ label: 'Matching', href: '/matchmaking' });
        break;

      case 'appointments':
        items.push({ label: 'Startseite', href: '/' });
        items.push({ label: 'Termine', href: '/appointments' });
        break;

      default:
        // Fallback for any future navigation sources
        items.push({ label: 'Startseite', href: '/' });
        break;
    }

    // Aktuelle Seite hinzufügen
    // Nutze skillName aus Kontext wenn auf Skill-Detail-Seite, sonst statisches Label
    const activeBreadcrumb = staticBreadcrumbs.find((b) => b.isActive === true);
    if (activeBreadcrumb && !items.some((item) => item.isActive === true)) {
      // Wenn wir auf einer Skill-Detail-Seite sind und skillName im Kontext haben
      const isSkillDetailPage = /^\/skills\/[^/]+$/.test(location.pathname);
      const label = isSkillDetailPage && skillName ? skillName : activeBreadcrumb.label;

      items.push({
        label,
        isActive: true,
      });
    }

    return items;
  }, [navigationContext, staticBreadcrumbs, location.pathname]);

  // ============================================================================
  // Navigation Functions
  // ============================================================================

  /**
   * Navigate with context - automatically passes navigation state
   */
  const navigateWithContext = useCallback(
    async (to: string, context?: NavigationContext, options?: { replace?: boolean }) => {
      if (to === location.pathname) return;

      await navigate(to, {
        ...options,
        state: context,
      });
    },
    [navigate, location.pathname]
  );

  /**
   * Navigate back based on context or browser history
   */
  const navigateBack = useCallback(() => {
    const { from, skillId } = navigationContext;

    // Wenn Kontext vorhanden, nutze ihn
    if (from) {
      if (from === 'skill' && skillId) {
        void navigate(`/skills/${skillId}`);
        return;
      }

      const sourceInfo = SOURCE_TO_BREADCRUMB[from];
      void navigate(sourceInfo.path);
      return;
    }

    // Fallback: previousPath oder Browser-History
    if (navigationState.previousPath) {
      void navigate(navigationState.previousPath);
    } else {
      void navigate(-1);
    }
  }, [navigate, navigationContext, navigationState.previousPath]);

  /**
   * Navigate to a skill detail page with proper context
   */
  const navigateToSkill = useCallback(
    async (skillId: string, context?: Partial<NavigationContext>) => {
      const from = getSourceFromPath();

      await navigateWithContext(`/skills/${skillId}`, {
        from,
        ...context,
      });
    },
    [getSourceFromPath, navigateWithContext]
  );

  /**
   * Navigate to a user profile with proper context
   */
  const navigateToProfile = useCallback(
    async (userId: string, context?: Partial<NavigationContext>) => {
      const from = getSourceFromPath();

      // Wenn wir von einem Skill kommen, SkillId mitgeben
      const skillMatch = /^\/skills\/([^/]+)$/.exec(location.pathname);
      const skillId = skillMatch?.[1];

      await navigateWithContext(`/users/${userId}/profile`, {
        from,
        skillId,
        ...context,
      });
    },
    [getSourceFromPath, navigateWithContext, location.pathname]
  );

  return {
    // Von useNavigationState
    isNavigating: navigationState.isNavigating,
    currentPath: navigationState.currentPath,
    previousPath: navigationState.previousPath,
    navigationDuration: navigationState.navigationDuration,
    navigateWithLoading: navigationState.navigateWithLoading,

    // Von useBreadcrumbs
    breadcrumbs: staticBreadcrumbs,
    pageTitle,

    // NEU
    navigationContext,
    contextualBreadcrumbs,
    navigateWithContext,
    navigateBack,
    navigateToSkill,
    navigateToProfile,
    getSourceFromPath,
  };
};

export default useNavigation;
