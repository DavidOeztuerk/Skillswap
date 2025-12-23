/**
 * Detection Module - Public API
 *
 * Zentrale Exports für Browser- und Feature-Detection.
 * Ersetzt alle duplizierten Detection-Implementierungen in der Codebase.
 *
 * @example
 * ```typescript
 * import {
 *   getBrowserInfo,
 *   isSafari,
 *   getE2EEMethod,
 *   requiresSafariWorker
 * } from '@/shared/detection';
 *
 * if (requiresSafariWorker()) {
 *   // Safari-spezifische Logik
 * }
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  BrowserName,
  E2EEMethod,
  BrowserInfo,
  E2EECapabilities,
  MediaCapabilities,
  CodecSupport,
  BrowserQuirks,
  FullBrowserCapabilities,
} from './types';

// ============================================================================
// Browser Detection
// ============================================================================

export {
  getBrowserInfo,
  isSafari,
  isChrome,
  isFirefox,
  isEdge,
  isOpera,
  isIOS,
  isAndroid,
  isMobile,
  isBrowserVersionAtLeast,
  resetBrowserInfoCache,
} from './browserDetector';

// ============================================================================
// E2EE Capabilities
// ============================================================================

export {
  getE2EECapabilities,
  getE2EEMethod,
  isE2EESupported,
  requiresSafariWorker,
  getE2EEMethodDescription,
  canSupportE2EEForGroup,
  getE2EEWorkerUrl,
  resetE2EECapabilitiesCache,
} from './e2eeCapabilities';
