// src/utils/buildOptimizations.ts
import React from 'react';

/**
 * Build-time and runtime optimizations
 */

/**
 * Lazy loading helper for components
 */
export const lazyWithRetry = (
  componentImport: () => Promise<{ default: React.ComponentType<any> }>,
  retries = 3
) => {
  return React.lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        console.warn(`Retry ${i + 1}/${retries} for component import failed:`, error);
        if (i === retries - 1) throw error;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('All retries failed');
  });
};

/**
 * Preload critical components
 */
export const preloadComponents = async () => {
  // Preload critical components that are likely to be used
  const criticalComponents = [
    () => import('../pages/DashboardPage'),
    () => import('../components/notifications/NotificationBell'),
    () => import('../pages/skills/SkillsPage'),
    () => import('../pages/matchmaking/MatchmakingPage'),
    () => import('../pages/appointments/AppointmentsPage'),
  ];

  // Preload in the background
  criticalComponents.forEach(componentImport => {
    requestIdleCallback(() => {
      componentImport().catch(() => {
        // Ignore preload errors
      });
    });
  });
};

/**
 * Service Worker registration for caching
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('🔧 Service Worker registered:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              console.log('🆕 New content available, please refresh.');
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

/**
 * Resource preloading
 */
export const preloadResources = () => {
  // Preload critical fonts
  const fonts = [
    '/fonts/roboto-v30-latin-regular.woff2',
    '/fonts/roboto-v30-latin-500.woff2',
  ];

  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = font;
    document.head.appendChild(link);
  });

  // Preload critical images
  const images = [
    '/icons/notification.png',
    '/images/logo.png',
  ];

  images.forEach(image => {
    const img = new Image();
    img.src = image;
  });
};

/**
 * Bundle analyzer helper for development
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // Analyze bundle size in development
    console.log('📊 Bundle Analysis:');
    console.log('- Use `npm run build -- --analyze` to analyze bundle size');
    console.log('- Consider code splitting for large components');
    console.log('- Check for duplicate dependencies');
  }
};

/**
 * Memory optimization
 */
export const optimizeMemory = () => {
  // Clean up inactive components
  if (typeof window !== 'undefined') {
    // Force garbage collection if available (development only)
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      setInterval(() => {
        (window as any).gc();
        console.log('🗑️ Manual garbage collection triggered');
      }, 60000); // Every minute
    }

    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        
        if (usedMB > 100) { // Warn if using more than 100MB
          console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
        }
      }
    }, 30000); // Every 30 seconds
  }
};

/**
 * Network optimization
 */
export const optimizeNetwork = () => {
  // Add network-specific optimizations
  const connection = (navigator as any).connection;
  
  if (connection) {
    const { effectiveType, downlink } = connection;
    
    // Adjust behavior based on connection
    if (effectiveType === '2g' || downlink < 1) {
      console.log('🐌 Slow connection detected, reducing quality');
      // Reduce image quality, disable animations, etc.
      document.documentElement.classList.add('slow-connection');
    } else if (effectiveType === '4g' || downlink > 5) {
      console.log('🚀 Fast connection detected, enabling high quality');
      document.documentElement.classList.add('fast-connection');
    }
  }
};

/**
 * Performance optimizations setup
 */
export const setupOptimizations = () => {
  // Setup on app initialization
  preloadComponents();
  preloadResources();
  registerServiceWorker();
  optimizeMemory();
  optimizeNetwork();
  analyzeBundleSize();
  
  console.log('✅ Build optimizations initialized');
};

/**
 * Critical CSS injection
 */
export const injectCriticalCSS = (css: string) => {
  const style = document.createElement('style');
  style.textContent = css;
  style.id = 'critical-css';
  document.head.appendChild(style);
};

/**
 * Defer non-critical CSS
 */
export const deferCSS = (href: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = () => {
    link.rel = 'stylesheet';
  };
  document.head.appendChild(link);
  
  // Fallback for browsers that don't support preload
  const noscript = document.createElement('noscript');
  const fallbackLink = document.createElement('link');
  fallbackLink.rel = 'stylesheet';
  fallbackLink.href = href;
  noscript.appendChild(fallbackLink);
  document.head.appendChild(noscript);
};

export default {
  lazyWithRetry,
  preloadComponents,
  registerServiceWorker,
  preloadResources,
  setupOptimizations,
  optimizeMemory,
  optimizeNetwork,
  injectCriticalCSS,
  deferCSS,
};