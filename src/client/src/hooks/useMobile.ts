// src/hooks/useMobile.ts
import { useTheme, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';

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
    // Detect touch capability
    const hasTouchScreen = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          (navigator as any).msMaxTouchPoints > 0;
    setIsTouchDevice(hasTouchScreen);

    // Detect orientation
    const updateOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
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
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isTouchDevice,
    orientation,
    screenSize: getScreenSize(),
  };
};

/**
 * Hook for mobile-specific styles
 */
export const useMobileStyles = () => {
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
    touchStyles: isTouchDevice ? {
      WebkitTapHighlightColor: 'transparent',
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
    } : {},
    
    // Mobile-optimized z-index
    mobileZIndex: {
      appBar: 1200,
      drawer: 1100,
      tabBar: 1000,
      fab: 1050,
    },
  };
};

/**
 * Hook for performance optimization on mobile
 */
export const useMobilePerformance = () => {
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