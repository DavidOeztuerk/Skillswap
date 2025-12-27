/**
 * Browser Detection Types
 * Zentrale Type-Definitionen für Browser- und Feature-Detection
 */

// ============================================================================
// Browser Types
// ============================================================================

/**
 * Unterstützte Browser-Namen
 */
export type BrowserName = 'Safari' | 'Firefox' | 'Chrome' | 'Edge' | 'Opera' | 'Unknown';

/**
 * Browser-Informationen
 */
export interface BrowserInfo {
  readonly name: BrowserName;
  readonly version: string;
  readonly majorVersion: number;
  readonly isMobile: boolean;
  readonly isIOS: boolean;
  readonly isAndroid: boolean;
  readonly isMacOS: boolean;
  readonly isWindows: boolean;
  readonly isLinux: boolean;
}

// ============================================================================
// E2EE Types
// ============================================================================

/**
 * Unterstützte E2EE Methoden
 *
 * - encodedStreams: Chrome's createEncodedStreams() API
 * - rtpTransform: RTCRtpSender.transform (Firefox, neuere Chrome)
 * - scriptTransform: Safari's RTCRtpScriptTransform
 * - none: Keine E2EE Unterstützung
 */
export type E2EEMethod = 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';

/**
 * E2EE Fähigkeiten des Browsers
 */
export interface E2EECapabilities {
  /** Ob E2EE generell unterstützt wird */
  readonly supported: boolean;
  /** Die zu verwendende E2EE Methode */
  readonly method: E2EEMethod;
  /** Chrome's createEncodedStreams() verfügbar */
  readonly supportsEncodedStreams: boolean;
  /** RTCRtpSender.transform verfügbar */
  readonly supportsRtpTransform: boolean;
  /** RTCRtpScriptTransform verfügbar (Safari/Firefox) */
  readonly supportsRtpScriptTransform: boolean;
  /** Ob RTCRtpScriptTransform verwendet wird */
  readonly usesScriptTransform: boolean;
}

// ============================================================================
// Media Types
// ============================================================================

/**
 * Media-Fähigkeiten des Browsers
 */
export interface MediaCapabilities {
  /** WebRTC unterstützt */
  readonly supportsWebRTC: boolean;
  /** Screen Sharing unterstützt */
  readonly supportsGetDisplayMedia: boolean;
  /** MediaRecorder unterstützt */
  readonly supportsMediaRecorder: boolean;
  /** Picture-in-Picture unterstützt */
  readonly supportsPictureInPicture: boolean;
  /** Audio Output Selection unterstützt */
  readonly supportsAudioOutputSelection: boolean;
  /** setSinkId unterstützt */
  readonly supportsSinkId: boolean;
}

/**
 * Codec-Unterstützung
 */
export interface CodecSupport {
  readonly supportsVP8: boolean;
  readonly supportsVP9: boolean;
  readonly supportsAV1: boolean;
  readonly supportsH264: boolean;
  readonly supportsOpus: boolean;
}

// ============================================================================
// Browser Quirks
// ============================================================================

/**
 * Browser-spezifische Eigenheiten und Workarounds
 *
 * HINWEIS: Moderne Browser (Safari 17+, Chrome, Firefox) haben die meisten
 * historischen Quirks behoben. Diese Liste enthält nur noch ECHTE Unterschiede.
 */
export interface BrowserQuirks {
  /** Safari: getUserMedia muss vor enumerateDevices aufgerufen werden */
  readonly requiresUserMediaBeforeEnumerate: boolean;
  /** Safari: Bekanntes Problem mit Camera-Freigabe */
  readonly hasKnownCameraReleaseIssue: boolean;
  /** iOS: Autoplay erfordert User Gesture */
  readonly requiresPlayGesture: boolean;
  /** Safari: Key muss vor RTCRtpScriptTransform gesetzt sein */
  readonly requiresKeyBeforeTransform: boolean;
  /** Safari: Track-Removal muss VOR stop() erfolgen */
  readonly requiresRemoveTrackBeforeStop: boolean;
  /** Private Mode: IndexedDB nicht verfügbar (wird async geprüft) */
  readonly indexedDBUnavailable: boolean;
}

// ============================================================================
// Crypto Capabilities
// ============================================================================

/**
 * WebCrypto API Fähigkeiten des Browsers
 */
export interface CryptoCapabilities {
  /** WebCrypto API verfügbar */
  readonly hasWebCrypto: boolean;
  /** SubtleCrypto verfügbar */
  readonly hasSubtleCrypto: boolean;
  /** ECDH Key Generation unterstützt */
  readonly supportsECDH: boolean;
  /** AES-GCM Encryption unterstützt */
  readonly supportsAesGcm: boolean;
  /** ECDSA Signing unterstützt */
  readonly supportsECDSA: boolean;
  /** Secure Context (HTTPS) aktiv */
  readonly isSecureContext: boolean;
  /** Private Browsing Mode erkannt */
  readonly isPrivateBrowsing: boolean;
}

// ============================================================================
// Worker Capabilities
// ============================================================================

/**
 * Web Worker Fähigkeiten
 */
export interface WorkerCapabilities {
  /** Web Workers unterstützt */
  readonly supportsWorkers: boolean;
  /** Transferable Objects unterstützt */
  readonly supportsTransferable: boolean;
  /** SharedArrayBuffer unterstützt (COOP/COEP headers required) */
  readonly supportsSharedArrayBuffer: boolean;
}

// ============================================================================
// Combined Types
// ============================================================================

/**
 * Alle Browser-Fähigkeiten kombiniert
 */
export interface FullBrowserCapabilities {
  readonly browser: BrowserInfo;
  readonly e2ee: E2EECapabilities;
  readonly media: MediaCapabilities;
  readonly codecs: CodecSupport;
  readonly quirks: BrowserQuirks;
  readonly crypto: CryptoCapabilities;
  readonly workers: WorkerCapabilities;
}

// ============================================================================
// Detection Result Types
// ============================================================================

/**
 * Ergebnis eines Feature-Tests
 */
export interface FeatureTestResult {
  readonly supported: boolean;
  readonly reason?: string;
}

/**
 * E2EE Readiness Check Ergebnis
 */
export interface E2EEReadinessResult {
  readonly ready: boolean;
  readonly method: E2EEMethod;
  readonly blockers: string[];
  readonly warnings: string[];
}
