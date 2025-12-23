/**
 * useResponsive Hook
 * Re-exports useMobile for semantic clarity when working with responsive layouts.
 *
 * Use this hook when you need:
 * - isMobile, isTablet, isDesktop breakpoint detection
 * - Screen size (xs, sm, md, lg, xl)
 * - Touch device detection
 * - Orientation (portrait/landscape)
 *
 * @example
 * const { isMobile, isDesktop, screenSize } = useResponsive();
 *
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 */

import useMobileDefault from './useMobile';

export {
  useMobile as useResponsive,
  useMobileStyles as useResponsiveStyles,
  useMobilePerformance as useResponsivePerformance,
  type MobileState as ResponsiveState,
} from './useMobile';

// Re-export as default for convenience
export default useMobileDefault;
