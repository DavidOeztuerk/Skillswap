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
  /** Safari's RTCRtpScriptTransform verfügbar */
  readonly supportsRtpScriptTransform: boolean;
  /** Ob der Safari Worker verwendet werden muss */
  readonly requiresSafariWorker: boolean;
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
 */
export interface BrowserQuirks {
  /** Safari: getUserMedia muss vor enumerateDevices aufgerufen werden */
  readonly requiresUserMediaBeforeEnumerate: boolean;
  /** Safari: Bekanntes Problem mit Camera-Freigabe */
  readonly hasKnownCameraReleaseIssue: boolean;
  /** iOS: Autoplay erfordert User Gesture */
  readonly requiresPlayGesture: boolean;
  /** Safari: Kein tagLength Parameter bei AES-GCM */
  readonly noAesGcmTagLength: boolean;
  /** Safari: Key muss vor RTCRtpScriptTransform gesetzt sein */
  readonly requiresKeyBeforeTransform: boolean;
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
}
