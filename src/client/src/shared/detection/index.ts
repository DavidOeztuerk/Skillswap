/**
 * Detection Module - Public API
 *
 * Zentrale Exports für Browser- und Feature-Detection.
 * Browser-agnostisch für moderne Browser (Safari 17+, Chrome, Firefox, Edge).
 *
 * @example
 * ```typescript
 * import {
 *   getBrowserInfo,
 *   isSafari,
 *   getE2EEMethod,
 *   usesScriptTransform
 * } from '@/shared/detection';
 *
 * if (usesScriptTransform()) {
 *   // RTCRtpScriptTransform wird verwendet
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
  CryptoCapabilities,
  WorkerCapabilities,
  FullBrowserCapabilities,
  FeatureTestResult,
  E2EEReadinessResult,
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
  // Enhanced Detection
  isPrivateBrowsing,
  getBrowserQuirks,
  getCryptoCapabilities,
  getWorkerCapabilities,
  getBrowserCapabilitiesSummary,
} from './browserDetector';

// ============================================================================
// E2EE Capabilities
// ============================================================================

export {
  getE2EECapabilities,
  getE2EEMethod,
  isE2EESupported,
  usesScriptTransformFn as usesScriptTransform,
  getE2EEMethodDescription,
  canSupportE2EEForGroup,
  getE2EEWorkerUrl,
  resetE2EECapabilitiesCache,
} from './e2eeCapabilities';
