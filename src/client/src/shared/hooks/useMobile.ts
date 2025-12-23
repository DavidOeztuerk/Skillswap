import { useEffect, useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { withDefault } from '../utils/safeAccess';

// Extended Navigator interface for legacy MS touch support
interface NavigatorWithMSTouchPoints extends Navigator {
  msMaxTouchPoints?: number;
}

export interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Custom hook for mobile detection and responsive behavior
 */
export const useMobile = (): MobileState => {
  const theme = useTheme();

  // Basic breakpoint detection
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  // const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  // Mobile and tablet detection
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const timer = setTimeout(() => {
      const nav = navigator as NavigatorWithMSTouchPoints;
      const hasTouchScreen =
        'ontouchstart' in window ||
        withDefault(navigator.maxTouchPoints, 0) > 0 ||
        withDefault(nav.msMaxTouchPoints, 0) > 0;
      setIsTouchDevice(hasTouchScreen);

      // Detect initial orientation
      const height = withDefault(window.innerHeight, 0);
      const width = withDefault(window.innerWidth, 0);
      const isPortrait = height > width;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    }, 0);

    // Detect orientation changes (these are event-driven, not synchronous)
    const updateOrientation = (): void => {
      const height = withDefault(window.innerHeight, 0);
      const width = withDefault(window.innerWidth, 0);
      const isPortrait = height > width;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  // Determine screen size
  const getScreenSize = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (isXs) return 'xs';
    if (isSm) return 'sm';
    if (isMd) return 'md';
    if (isLg) return 'lg';
    return 'xl';
  };

  return {
    isMobile: withDefault(isMobile, false),
    isTablet: withDefault(isTablet, false),
    isDesktop: withDefault(isDesktop, true),
    isSmallMobile: withDefault(isSmallMobile, false),
    isTouchDevice: withDefault(isTouchDevice, false),
    orientation,
    screenSize: getScreenSize(),
  };
};

interface MobileStyles {
  touchSpacing: number;
  buttonSize: 'large' | 'medium';
  containerPadding: {
    xs: number;
    sm: number;
    md: number;
  };
  cardSpacing: number;
  titleVariant: 'h4' | 'h5';
  subtitleVariant: 'body1' | 'body2';
  touchStyles: Record<string, string>;
  mobileZIndex: {
    appBar: number;
    drawer: number;
    tabBar: number;
    fab: number;
  };
}

/**
 * Hook for mobile-specific styles
 */
export const useMobileStyles = (): MobileStyles => {
  const { isMobile, isSmallMobile, isTouchDevice } = useMobile();

  return {
    // Touch-friendly spacing
    touchSpacing: isMobile ? 2 : 1,

    // Button sizing
    buttonSize: isMobile ? 'large' : 'medium',

    // Container padding
    containerPadding: {
      xs: isSmallMobile ? 1 : 2,
      sm: 3,
      md: 4,
    },

    // Card spacing
    cardSpacing: isMobile ? 1 : 2,

    // Typography scaling
    titleVariant: isMobile ? 'h5' : 'h4',
    subtitleVariant: isMobile ? 'body2' : 'body1',

    // Touch-specific properties
    touchStyles: isTouchDevice
      ? {
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }
      : {},

    // Mobile-optimized z-index
    mobileZIndex: {
      appBar: 1200,
      drawer: 1100,
      tabBar: 1000,
      fab: 1050,
    },
  };
};

interface MobilePerformance {
  reduceMotion: boolean;
  transition: string;
  scrollBehavior: 'auto' | 'smooth';
  shouldLazyLoad: boolean;
  imageQuality: 'medium' | 'high';
  shouldCodeSplit: boolean;
}

/**
 * Hook for performance optimization on mobile
 */
export const useMobilePerformance = (): MobilePerformance => {
  const { isMobile, isTouchDevice } = useMobile();

  return {
    // Reduce animations on mobile for better performance
    reduceMotion: isMobile,

    // Use simpler transitions on mobile
    transition: isMobile ? 'none' : 'all 0.2s ease-in-out',

    // Optimize scroll behavior
    scrollBehavior: isTouchDevice ? 'auto' : 'smooth',

    // Lazy loading recommendations
    shouldLazyLoad: isMobile,

    // Image optimization
    imageQuality: isMobile ? 'medium' : 'high',

    // Bundle splitting recommendations
    shouldCodeSplit: isMobile,
  };
};

export default useMobile;
