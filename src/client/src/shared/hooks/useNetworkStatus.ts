import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
export type ConnectionType =
  | 'unknown'
  | '2g'
  | '3g'
  | '4g'
  | 'wifi'
  | 'ethernet'
  | 'cellular'
  | 'none';

export interface NetworkStatus {
  /** Is the device online? */
  isOnline: boolean;

  /** Is the connection slow? */
  isSlowConnection: boolean;

  /** Effective connection type */
  connectionType: ConnectionType;

  /** Effective connection speed (Network Information API) */
  effectiveType: EffectiveConnectionType;

  /** Estimated downstream bandwidth in Mbps */
  downlink?: number;

  /** Round-trip time in ms */
  rtt?: number;

  /** Is data saver mode enabled? */
  saveData?: boolean;

  /** Quality score 0-100 for UI display */
  qualityScore: number;

  /** Recommended video quality based on network */
  recommendedVideoQuality: 'low' | 'medium' | 'hd' | '4k';

  /** Timestamp of last update */
  lastUpdated: number;
}

interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly effectiveType: EffectiveConnectionType;
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: string;
  onchange: ((this: NetworkInformation, ev: Event) => void) | null;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

// ============================================================================
// Debug Configuration
// ============================================================================

// Disable verbose logging - only log actual state changes
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
let DEBUG: boolean = false;

// Allow enabling debug mode at runtime for troubleshooting
export function setNetworkDebug(enabled: boolean): void {
  DEBUG = enabled;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getConnection(): NetworkInformation | null {
  return navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection ?? null;
}

function calculateQualityScore(
  isOnline: boolean,
  effectiveType: EffectiveConnectionType,
  downlink?: number,
  rtt?: number
): number {
  if (!isOnline) return 0;

  let score = 50; // Baseline

  // Effective Type Score
  switch (effectiveType) {
    case '4g':
      score += 30;
      break;
    case '3g':
      score += 15;
      break;
    case '2g':
      score -= 10;
      break;
    case 'slow-2g':
      score -= 30;
      break;
    case 'unknown':
    default:
      // No score change for unknown connection type
      break;
  }

  // Downlink Score (0-10 Mbps → 0-20 points)
  if (downlink !== undefined) {
    score += Math.min(downlink * 2, 20);
  }

  // RTT Score (0-500ms → 0 to -20 points)
  if (rtt !== undefined) {
    score -= Math.min(rtt / 25, 20);
  }

  return Math.max(0, Math.min(100, score));
}

function getRecommendedVideoQuality(
  qualityScore: number,
  saveData?: boolean
): 'low' | 'medium' | 'hd' | '4k' {
  if (saveData) return 'low';

  if (qualityScore >= 80) return '4k';
  if (qualityScore >= 60) return 'hd';
  if (qualityScore >= 40) return 'medium';
  return 'low';
}

function mapConnectionType(type?: string): ConnectionType {
  if (!type) return 'unknown';

  switch (type.toLowerCase()) {
    case 'wifi':
      return 'wifi';
    case 'ethernet':
      return 'ethernet';
    case 'cellular':
    case '4g':
    case 'lte':
      return '4g';
    case '3g':
    case 'hspa':
    case 'hsdpa':
      return '3g';
    case '2g':
    case 'edge':
    case 'gprs':
      return '2g';
    case 'none':
      return 'none';
    default:
      return 'unknown';
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    qualityScore: 50,
    recommendedVideoQuality: 'hd',
    lastUpdated: Date.now(),
  }));

  // Ref for debouncing
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateNetworkStatus = useCallback(() => {
    // Debounce updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const isOnline = navigator.onLine;
      const connection = getConnection();

      let effectiveType: EffectiveConnectionType = 'unknown';
      let connectionType: ConnectionType = 'unknown';
      let isSlowConnection = false;
      let downlink: number | undefined;
      let rtt: number | undefined;
      let saveData: boolean | undefined;

      if (connection) {
        downlink = connection.downlink;
        rtt = connection.rtt;
        saveData = connection.saveData;
        effectiveType = connection.effectiveType;
        connectionType = mapConnectionType(connection.type);

        // Determine if connection is slow
        isSlowConnection =
          effectiveType === '2g' ||
          effectiveType === 'slow-2g' ||
          downlink < 1.5 ||
          rtt > 400 ||
          saveData;
      }

      const qualityScore = calculateQualityScore(isOnline, effectiveType, downlink, rtt);
      const recommendedVideoQuality = getRecommendedVideoQuality(qualityScore, saveData);

      setNetworkStatus((prev) => {
        // Only update and log if there's an actual change
        const hasChanged =
          prev.isOnline !== isOnline ||
          prev.effectiveType !== effectiveType ||
          prev.connectionType !== connectionType ||
          prev.isSlowConnection !== isSlowConnection;

        if (!hasChanged) {
          return prev; // No change, return previous state to avoid re-render
        }

        // Log only on actual state changes (not periodic checks)
        if (DEBUG && process.env.NODE_ENV === 'development') {
          console.debug('🌐 Network Status Changed:', {
            isOnline,
            effectiveType,
            connectionType,
            downlink: downlink === undefined ? 'N/A' : `${downlink.toFixed(2)} Mbps`,
            rtt: rtt === undefined ? 'N/A' : `${rtt} ms`,
            qualityScore,
          });
        }

        return {
          isOnline,
          isSlowConnection,
          connectionType,
          effectiveType,
          downlink,
          rtt,
          saveData,
          qualityScore,
          recommendedVideoQuality,
          lastUpdated: Date.now(),
        };
      });
    }, 100); // 100ms debounce
  }, []);

  useEffect(() => {
    // Initial status
    updateNetworkStatus();

    // Online/Offline Events
    const handleOnline = (): void => {
      if (DEBUG) console.debug('🟢 Network: Online');
      updateNetworkStatus();
    };

    const handleOffline = (): void => {
      if (DEBUG) console.debug('🔴 Network: Offline');
      updateNetworkStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API Events
    const connection = getConnection();
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Periodic check (every 30 seconds)
    const periodicCheck = setInterval(updateNetworkStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }

      clearInterval(periodicCheck);

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateNetworkStatus]);

  return networkStatus;
}

// ============================================================================
// Utility Hook: Network Quality for WebRTC
// ============================================================================

export interface WebRTCNetworkRecommendations {
  /** Should video be enabled? */
  enableVideo: boolean;

  /** Recommended video resolution */
  videoConstraints: MediaTrackConstraints;

  /** Recommended audio settings */
  audioConstraints: MediaTrackConstraints;

  /** Should simulcast be used? */
  useSimulcast: boolean;

  /** Recommended max bitrate for video (kbps) */
  maxVideoBitrate: number;

  /** Warning for user? */
  userWarning: string | null;
}

export function useWebRTCNetworkRecommendations(): WebRTCNetworkRecommendations {
  const networkStatus = useNetworkStatus();

  const getRecommendations = useCallback((): WebRTCNetworkRecommendations => {
    const { qualityScore, isOnline, saveData, isSlowConnection } = networkStatus;

    // Offline
    if (!isOnline) {
      return {
        enableVideo: false,
        videoConstraints: { width: 0, height: 0 },
        audioConstraints: { echoCancellation: true, noiseSuppression: true },
        useSimulcast: false,
        maxVideoBitrate: 0,
        userWarning: 'No internet connection. Please check your network settings.',
      };
    }

    // Data Saver Mode
    if (saveData) {
      return {
        enableVideo: false,
        videoConstraints: { width: 320, height: 240, frameRate: 15 },
        audioConstraints: { echoCancellation: true, noiseSuppression: true },
        useSimulcast: false,
        maxVideoBitrate: 150,
        userWarning: 'Data saver mode active. Video is disabled.',
      };
    }

    // Very poor connection
    if (qualityScore < 30) {
      return {
        enableVideo: false,
        videoConstraints: { width: 320, height: 240, frameRate: 10 },
        audioConstraints: { echoCancellation: true, noiseSuppression: true },
        useSimulcast: false,
        maxVideoBitrate: 100,
        userWarning: 'Very slow connection. Video has been disabled for better audio quality.',
      };
    }

    // Poor connection
    if (qualityScore < 50 || isSlowConnection) {
      return {
        enableVideo: true,
        videoConstraints: { width: 640, height: 480, frameRate: 15 },
        audioConstraints: { echoCancellation: true, noiseSuppression: true },
        useSimulcast: false,
        maxVideoBitrate: 300,
        userWarning: 'Slow connection detected. Video quality has been reduced.',
      };
    }

    // Medium connection
    if (qualityScore < 70) {
      return {
        enableVideo: true,
        videoConstraints: { width: 1280, height: 720, frameRate: 24 },
        audioConstraints: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        useSimulcast: true,
        maxVideoBitrate: 1500,
        userWarning: null,
      };
    }

    // Good connection
    if (qualityScore < 90) {
      return {
        enableVideo: true,
        videoConstraints: { width: 1280, height: 720, frameRate: 30 },
        audioConstraints: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        useSimulcast: true,
        maxVideoBitrate: 2500,
        userWarning: null,
      };
    }

    // Excellent connection
    return {
      enableVideo: true,
      videoConstraints: { width: 1920, height: 1080, frameRate: 30 },
      audioConstraints: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      useSimulcast: true,
      maxVideoBitrate: 4000,
      userWarning: null,
    };
  }, [networkStatus]);

  return getRecommendations();
}

export default useNetworkStatus;
