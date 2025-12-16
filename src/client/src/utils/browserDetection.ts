/**
 * Browser Detection & Feature Capabilities Utility
 *
 * Cross-Browser Support für VideoCall-Funktionalität
 * - Safari (Desktop & iOS)
 * - Chrome (Desktop & Android)
 * - Firefox (Desktop & Android)
 * - Edge (Chromium-based)
 *
 * @author Skillswap Team
 */

// ============================================================================
// Types
// ============================================================================

export interface BrowserInfo {
  name: 'Safari' | 'Firefox' | 'Chrome' | 'Edge' | 'Opera' | 'Unknown';
  version: string;
  majorVersion: number;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  isLinux: boolean;
}

/**
 * Detaillierte Browser-Fähigkeiten mit Feature Detection
 */
export interface BrowserCapabilities {
  // Video Codecs
  supportsVP8: boolean;
  supportsVP9: boolean;
  supportsAV1: boolean;
  supportsH264: boolean;

  // WebRTC Core
  supportsWebRTC: boolean;
  supportsGetDisplayMedia: boolean;

  // Audio Output Selection
  supportsAudioOutputSelection: boolean;
  supportsSinkId: boolean;

  // E2EE Support
  supportsInsertableStreams: boolean;
  supportsEncodedStreams: boolean; // Chrome: createEncodedStreams()
  supportsRtpTransform: boolean; // Firefox: RTCRtpSender.transform
  supportsRtpScriptTransform: boolean; // Safari: RTCRtpScriptTransform
  e2eeMethod: 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';
  requiresSafariWorker: boolean; // Safari benötigt speziellen Worker

  // Safari-specific quirks
  requiresUserMediaBeforeEnumerate: boolean;
  hasKnownCameraReleaseIssue: boolean;
  requiresPlayGesture: boolean;

  // General
  supportsMediaRecorder: boolean;
  supportsPictureInPicture: boolean;
}

/**
 * Audio Output Device Info mit Verfügbarkeits-Status
 */
export interface AudioOutputInfo {
  isSupported: boolean;
  devices: MediaDeviceInfo[];
  canSetSinkId: boolean;
  fallbackMessage: string | null;
}

// ============================================================================
// Browser Detection
// ============================================================================

/**
 * Parse User Agent und extrahiere Browser-Informationen
 */
function parseUserAgent(): BrowserInfo {
  const ua = navigator.userAgent;
  // Note: navigator.platform is deprecated, but userAgentData is not widely supported yet
  // Using userAgent string as primary detection method
  const platformFromUA = ua.includes('Win')
    ? 'Win'
    : ua.includes('Mac')
      ? 'Mac'
      : ua.includes('Linux')
        ? 'Linux'
        : 'Unknown';

  // Mobile Detection
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMacOS = /Mac/i.test(platformFromUA) && !isIOS;
  const isWindows = /Win/i.test(platformFromUA);
  const isLinux = /Linux/i.test(platformFromUA) && !isAndroid;

  let name: BrowserInfo['name'] = 'Unknown';
  let version = '';

  // WICHTIG: Reihenfolge ist entscheidend!
  // Safari zuerst, da Chrome/Edge "Safari" im UA enthalten
  if (
    (/Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)) ||
    (isIOS && !/Chrome|Edg|Firefox/i.test(ua))
  ) {
    name = 'Safari';
    const match = /Version\/(\d+(\.\d+)*)/.exec(ua);
    version = match?.[1] ?? '';

    // iOS Safari Version
    if (isIOS && !version) {
      const iOSMatch = /OS (\d+)_(\d+)_?(\d+)?/.exec(ua);
      if (iOSMatch) {
        version = `${iOSMatch[1]}.${iOSMatch[2]}`;
      }
    }
  } else if (/Edg\//i.test(ua)) {
    name = 'Edge';
    const match = /Edg\/(\d+(\.\d+)*)/.exec(ua);
    version = match?.[1] ?? '';
  } else if (/OPR\/|Opera/i.test(ua)) {
    name = 'Opera';
    const match = /(?:OPR|Opera)[/\s](\d+(\.\d+)*)/.exec(ua);
    version = match?.[1] ?? '';
  } else if (/Chrome|Chromium/i.test(ua) && !/Edg/i.test(ua)) {
    name = 'Chrome';
    const match = /(?:Chrome|Chromium)\/(\d+(\.\d+)*)/.exec(ua);
    version = match?.[1] ?? '';
  } else if (/Firefox/i.test(ua)) {
    name = 'Firefox';
    const match = /Firefox\/(\d+(\.\d+)*)/.exec(ua);
    version = match?.[1] ?? '';
  }

  const majorVersion = parseInt(version.split('.')[0], 10) || 0;

  return {
    name,
    version,
    majorVersion,
    isMobile,
    isIOS,
    isAndroid,
    isMacOS,
    isWindows,
    isLinux,
  };
}

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Prüfe Video-Codec-Unterstützung
 */
function checkCodecSupport(): {
  vp8: boolean;
  vp9: boolean;
  av1: boolean;
  h264: boolean;
} {
  const result = { vp8: true, vp9: false, av1: false, h264: true };

  if (!('RTCRtpSender' in window) || typeof RTCRtpSender.getCapabilities !== 'function') {
    return result;
  }

  try {
    const capabilities = RTCRtpSender.getCapabilities('video');
    if (capabilities?.codecs) {
      result.vp8 = capabilities.codecs.some((c) => c.mimeType.toLowerCase().includes('vp8'));
      result.vp9 = capabilities.codecs.some((c) => c.mimeType.toLowerCase().includes('vp9'));
      result.av1 = capabilities.codecs.some((c) => c.mimeType.toLowerCase().includes('av1'));
      result.h264 = capabilities.codecs.some((c) => c.mimeType.toLowerCase().includes('h264'));
    }
  } catch (error) {
    console.warn('⚠️ Could not check codec support:', error);
  }

  return result;
}

/**
 * Prüfe Audio Output Selection Support
 */
function checkAudioOutputSupport(): {
  supportsSelection: boolean;
  supportsSinkId: boolean;
} {
  // Prüfe ob setSinkId auf HTMLMediaElement existiert
  const supportsSinkId = 'setSinkId' in HTMLMediaElement.prototype;

  // Prüfe ob audiooutput-Geräte enumerable sind
  const supportsSelection =
    supportsSinkId &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.enumerateDevices === 'function';

  return { supportsSelection, supportsSinkId };
}

/**
 * Prüfe E2EE/Insertable Streams Support für ALLE Browser
 * WICHTIG: Verwendet robuste Safari-Erkennung (synchron mit insertableStreamsHandler.ts)
 * @param _browserInfo - Wird für Signatur-Kompatibilität beibehalten, aber intern nicht genutzt
 */
function checkE2EESupport(_browserInfo: BrowserInfo): {
  supportsInsertableStreams: boolean;
  supportsEncodedStreams: boolean;
  supportsRtpTransform: boolean;
  supportsRtpScriptTransform: boolean;
  method: 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';
  requiresSafariWorker: boolean;
} {
  // ROBUSTE Safari-Erkennung (User-Agent allein reicht NICHT!)
  // Chrome 118+ hat auch RTCRtpScriptTransform, aber braucht rtpTransform!
  const isSafari = (() => {
    const ua = navigator.userAgent;
    // WebKit-Feature + Safari im UA OHNE Chrome/Chromium/Edge
    const isWebKit = 'webkitSpeechRecognition' in window || 'webkitAudioContext' in window;
    const hasSafariInUA =
      ua.includes('Safari') &&
      !ua.includes('Chrome') &&
      !ua.includes('Chromium') &&
      !ua.includes('Edg');
    return isWebKit && hasSafariInUA;
  })();

  // Feature Detection
  const supportsRtpScriptTransform = typeof RTCRtpScriptTransform !== 'undefined';
  const supportsEncodedStreams =
    typeof RTCRtpSender !== 'undefined' && 'createEncodedStreams' in RTCRtpSender.prototype;
  const supportsRtpTransform =
    typeof RTCRtpSender !== 'undefined' && 'transform' in RTCRtpSender.prototype;

  // Methode bestimmen - MUSS identisch sein mit insertableStreamsHandler.ts!
  let method: 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none' = 'none';
  let requiresSafariWorker = false;

  // Browser-spezifische Erkennung (gleiche Logik wie insertableStreamsHandler.ts)
  const ua = navigator.userAgent.toLowerCase();
  const isChrome = ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg');
  const isFirefox = ua.includes('firefox');

  // 1. NUR Safari darf scriptTransform verwenden!
  if (isSafari && supportsRtpScriptTransform) {
    method = 'scriptTransform';
    requiresSafariWorker = true;
  }
  // 2. CHROME/EDGE: encodedStreams BEVORZUGEN (Chrome 86+ hat beides, aber encodedStreams ist korrekt!)
  else if (isChrome && supportsEncodedStreams) {
    method = 'encodedStreams';
  }
  // 3. Chrome ohne encodedStreams (Fallback zu rtpTransform)
  else if (isChrome && supportsRtpTransform) {
    method = 'rtpTransform';
  }
  // 4. FIREFOX: rtpTransform verwenden
  else if (isFirefox && supportsRtpTransform) {
    method = 'rtpTransform';
  }
  // 5. Andere Browser mit rtpTransform
  else if (supportsRtpTransform) {
    method = 'rtpTransform';
  }
  // 6. Andere Browser mit encodedStreams
  else if (supportsEncodedStreams) {
    method = 'encodedStreams';
  }

  const supportsInsertableStreams = method !== 'none';

  return {
    supportsInsertableStreams,
    supportsEncodedStreams,
    supportsRtpTransform,
    // Nur für echtes Safari true!
    supportsRtpScriptTransform: isSafari && supportsRtpScriptTransform,
    method,
    requiresSafariWorker,
  };
}

/**
 * Prüfe Browser-spezifische Quirks und Limitationen
 */
function checkBrowserQuirks(browserInfo: BrowserInfo): {
  requiresUserMediaBeforeEnumerate: boolean;
  hasKnownCameraReleaseIssue: boolean;
  requiresPlayGesture: boolean;
} {
  const isSafari = browserInfo.name === 'Safari';
  const { isIOS } = browserInfo;
  const isOlderSafari = isSafari && browserInfo.majorVersion < 15;

  return {
    // Safari gibt keine Device Labels ohne vorherigen getUserMedia Aufruf
    requiresUserMediaBeforeEnumerate: isSafari,

    // Safari hat Probleme mit Camera Release (Memory Leak)
    hasKnownCameraReleaseIssue: isSafari || isOlderSafari,

    // Safari/iOS blockiert Autoplay ohne User Gesture
    requiresPlayGesture: isSafari || isIOS,
  };
}

/**
 * Prüfe allgemeine Feature Support
 */
function checkGeneralFeatures(browserInfo: BrowserInfo): {
  supportsWebRTC: boolean;
  supportsGetDisplayMedia: boolean;
  supportsMediaRecorder: boolean;
  supportsPictureInPicture: boolean;
} {
  const { isIOS } = browserInfo;

  return {
    supportsWebRTC: 'RTCPeerConnection' in window,

    // iOS unterstützt kein getDisplayMedia
    supportsGetDisplayMedia:
      !isIOS &&
      typeof navigator.mediaDevices !== 'undefined' &&
      'getDisplayMedia' in navigator.mediaDevices,

    supportsMediaRecorder: 'MediaRecorder' in window,
    supportsPictureInPicture: 'pictureInPictureEnabled' in document,
  };
}

/**
 * Ermittle vollständige Browser-Fähigkeiten
 */
function detectCapabilities(browserInfo: BrowserInfo): BrowserCapabilities {
  const codecSupport = checkCodecSupport();
  const audioOutput = checkAudioOutputSupport();
  const e2ee = checkE2EESupport(browserInfo);
  const quirks = checkBrowserQuirks(browserInfo);
  const generalFeatures = checkGeneralFeatures(browserInfo);

  return {
    // Video Codecs
    supportsVP8: codecSupport.vp8,
    supportsVP9: codecSupport.vp9,
    supportsAV1: codecSupport.av1,
    supportsH264: codecSupport.h264,

    // WebRTC Core
    supportsWebRTC: generalFeatures.supportsWebRTC,
    supportsGetDisplayMedia: generalFeatures.supportsGetDisplayMedia,

    // Audio Output
    supportsAudioOutputSelection: audioOutput.supportsSelection && !browserInfo.isIOS,
    supportsSinkId: audioOutput.supportsSinkId && !browserInfo.isIOS,

    // E2EE Support (VOLLSTÄNDIG für alle Browser)
    supportsInsertableStreams: e2ee.supportsInsertableStreams,
    supportsEncodedStreams: e2ee.supportsEncodedStreams,
    supportsRtpTransform: e2ee.supportsRtpTransform,
    supportsRtpScriptTransform: e2ee.supportsRtpScriptTransform,
    e2eeMethod: e2ee.method,
    requiresSafariWorker: e2ee.requiresSafariWorker,

    // Browser-spezifische Quirks
    requiresUserMediaBeforeEnumerate: quirks.requiresUserMediaBeforeEnumerate,
    hasKnownCameraReleaseIssue: quirks.hasKnownCameraReleaseIssue,
    requiresPlayGesture: quirks.requiresPlayGesture,

    // General Features
    supportsMediaRecorder: generalFeatures.supportsMediaRecorder,
    supportsPictureInPicture: generalFeatures.supportsPictureInPicture,
  };
}

// ============================================================================
// Cached Instances
// ============================================================================

let cachedBrowserInfo: BrowserInfo | null = null;
let cachedCapabilities: BrowserCapabilities | null = null;

/**
 * Browser-Informationen abrufen (synchron, cached)
 */
export function getBrowserInfo(): BrowserInfo {
  if (!cachedBrowserInfo) {
    cachedBrowserInfo = parseUserAgent();
    console.debug('🌐 Browser detected:', cachedBrowserInfo);
  }
  return cachedBrowserInfo;
}

/**
 * Browser-Fähigkeiten abrufen (cached)
 */
export function getBrowserCapabilities(): BrowserCapabilities {
  if (cachedCapabilities === null) {
    cachedCapabilities = detectCapabilities(getBrowserInfo());

    if (process.env.NODE_ENV === 'development') {
      console.debug('🔧 Browser capabilities loaded:', {
        browser: getBrowserInfo().name,
        version: getBrowserInfo().majorVersion,
        e2eeMethod: cachedCapabilities.e2eeMethod,
        e2eeSupported: cachedCapabilities.supportsInsertableStreams,
        audioOutput: cachedCapabilities.supportsAudioOutputSelection,
        screenShare: cachedCapabilities.supportsGetDisplayMedia,
      });
    }
  }

  return cachedCapabilities;
}

/**
 * Synchroner Zugriff auf Capabilities (gibt null zurück wenn noch nicht geladen)
 */
export function getBrowserCapabilitiesSync(): BrowserCapabilities | null {
  return cachedCapabilities;
}

// ============================================================================
// Quick-Check Helpers (browserInfo object)
// ============================================================================

export const browserInfo = {
  get isSafari(): boolean {
    return getBrowserInfo().name === 'Safari';
  },

  get isFirefox(): boolean {
    return getBrowserInfo().name === 'Firefox';
  },

  get isChrome(): boolean {
    return getBrowserInfo().name === 'Chrome';
  },

  get isEdge(): boolean {
    return getBrowserInfo().name === 'Edge';
  },

  get isOpera(): boolean {
    return getBrowserInfo().name === 'Opera';
  },

  get isMobile(): boolean {
    return getBrowserInfo().isMobile;
  },

  get isIOS(): boolean {
    return getBrowserInfo().isIOS;
  },

  get isAndroid(): boolean {
    return getBrowserInfo().isAndroid;
  },

  get isMacOS(): boolean {
    return getBrowserInfo().isMacOS;
  },

  get isWindows(): boolean {
    return getBrowserInfo().isWindows;
  },

  get isLinux(): boolean {
    return getBrowserInfo().isLinux;
  },

  get majorVersion(): number {
    return getBrowserInfo().majorVersion;
  },

  get version(): string {
    return getBrowserInfo().version;
  },

  /**
   * Gibt die bevorzugten Video-Codecs für diesen Browser zurück
   */
  getPreferredVideoCodecs(): string[] {
    const info = getBrowserInfo();
    const caps = getBrowserCapabilities();

    // Safari: H.264 bevorzugen (beste Unterstützung)
    if (info.name === 'Safari') {
      return ['video/H264', 'video/VP8'];
    }

    // Chrome/Edge/Opera mit VP9 Support
    if (caps.supportsVP9) {
      return ['video/VP9', 'video/H264', 'video/VP8'];
    }

    // Standard-Fallback
    return ['video/H264', 'video/VP8'];
  },

  /**
   * Prüfe ob E2EE unterstützt wird
   */
  supportsE2EE(): boolean {
    const caps = getBrowserCapabilities();
    return caps.supportsInsertableStreams;
  },

  /**
   * Hole die E2EE Methode für diesen Browser
   */
  getE2EEMethod(): 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none' {
    const caps = getBrowserCapabilities();
    return caps.e2eeMethod;
  },

  /**
   * Prüfe ob Safari Worker für E2EE benötigt wird
   */
  requiresSafariWorker(): boolean {
    const caps = getBrowserCapabilities();
    return caps.requiresSafariWorker;
  },

  /**
   * Prüfe ob Audio Output Selection möglich ist
   */
  supportsAudioOutputSelection(): boolean {
    const caps = getBrowserCapabilities();
    return caps.supportsAudioOutputSelection;
  },

  /**
   * Prüfe ob Screen Sharing möglich ist
   */
  supportsScreenShare(): boolean {
    const caps = getBrowserCapabilities();
    return caps.supportsGetDisplayMedia;
  },

  /**
   * Prüfe ob Browser Autoplay-Gesture benötigt
   */
  requiresPlayGesture(): boolean {
    const caps = getBrowserCapabilities();
    return caps.requiresPlayGesture;
  },

  /**
   * Prüfe ob Browser getUserMedia vor enumerateDevices benötigt
   */
  requiresUserMediaBeforeEnumerate(): boolean {
    const caps = getBrowserCapabilities();
    return caps.requiresUserMediaBeforeEnumerate;
  },
};

// ============================================================================
// Audio Output Utilities
// ============================================================================

/**
 * Hole Audio Output Geräte mit vollständiger Browser-Kompatibilität
 *
 * @param existingStream - Optional: Bereits vorhandener Stream (vermeidet doppelte getUserMedia)
 * @returns AudioOutputInfo mit Geräten und Fallback-Message
 */
export async function getAudioOutputDevices(
  existingStream?: MediaStream | null
): Promise<AudioOutputInfo> {
  const info = getBrowserInfo();

  // iOS: Keine Audio Output Selection möglich
  if (info.isIOS) {
    return {
      isSupported: false,
      devices: [],
      canSetSinkId: false,
      fallbackMessage:
        'iOS unterstützt keine Lautsprecher-Auswahl. Audio wird über den Standard-Lautsprecher ausgegeben.',
    };
  }

  // Safari Desktop: Eingeschränkte Unterstützung
  if (info.name === 'Safari') {
    // Safari < 17: Keine setSinkId Unterstützung
    if (info.majorVersion < 17) {
      return {
        isSupported: false,
        devices: [],
        canSetSinkId: false,
        fallbackMessage: `Safari ${String(info.majorVersion)} unterstützt keine Lautsprecher-Auswahl. Bitte nutze deinen Standard-Lautsprecher.`,
      };
    }

    // Safari 17+: Eingeschränkte Unterstützung
    console.debug('🍎 Safari 17+: Limited audio output support');
  }

  // Hole Geräte
  try {
    let devices = await navigator.mediaDevices.enumerateDevices();

    // Safari: Benötigt getUserMedia für Labels
    const caps = getBrowserCapabilities();
    if (
      info.name === 'Safari' &&
      existingStream === undefined &&
      caps.requiresUserMediaBeforeEnumerate
    ) {
      const hasLabels = devices.some((d) => d.kind === 'audiooutput' && Boolean(d.label));

      if (!hasLabels) {
        console.debug('🍎 Safari: Requesting temp stream for device labels...');
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          tempStream.getTracks().forEach((t) => {
            t.stop();
          });
          await new Promise((r) => setTimeout(r, 100));
          devices = await navigator.mediaDevices.enumerateDevices();
        } catch (e) {
          console.warn('⚠️ Could not get temp stream for labels:', e);
        }
      }
    }

    const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

    // Keine audiooutput Geräte gefunden
    if (audioOutputs.length === 0) {
      return {
        isSupported: false,
        devices: [],
        canSetSinkId: false,
        fallbackMessage:
          info.name === 'Safari'
            ? 'Safari gibt keine Lautsprecher zurück. Audio wird über den Standard-Lautsprecher ausgegeben.'
            : 'Keine Lautsprecher gefunden. Prüfe deine Audio-Einstellungen.',
      };
    }

    return {
      isSupported: true,
      devices: audioOutputs,
      canSetSinkId: true,
      fallbackMessage: null,
    };
  } catch (error) {
    console.error('❌ Error getting audio output devices:', error);
    return {
      isSupported: false,
      devices: [],
      canSetSinkId: false,
      fallbackMessage: 'Fehler beim Laden der Audio-Geräte.',
    };
  }
}

/**
 * Setze Audio Output auf einem HTMLMediaElement (Cross-Browser)
 */
export async function setAudioOutput(
  element: HTMLMediaElement,
  deviceId: string
): Promise<boolean> {
  const caps = getBrowserCapabilities();

  if (!caps.supportsSinkId) {
    console.warn('⚠️ setSinkId not supported in this browser');
    return false;
  }

  try {
    // TypeScript: setSinkId ist nicht im Standard-Interface
    await (
      element as HTMLMediaElement & { setSinkId: (sinkId: string) => Promise<void> }
    ).setSinkId(deviceId);
    console.debug(`✅ Audio output set to: ${deviceId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to set audio output:', error);
    return false;
  }
}

// ============================================================================
// Device Enumeration Utilities
// ============================================================================

/**
 * Geräte mit Labels abrufen (Safari-kompatibel)
 * Safari gibt leere Labels zurück bis getUserMedia() aufgerufen wurde
 *
 * @param existingStream - Optionaler bereits existierender Stream
 */
export async function getDevicesWithLabels(
  existingStream?: MediaStream | null
): Promise<MediaDeviceInfo[]> {
  const info = getBrowserInfo();
  const caps = getBrowserCapabilities();

  // Safari benötigt erst einen Stream bevor Labels verfügbar sind
  if (info.name === 'Safari' && caps.requiresUserMediaBeforeEnumerate && !existingStream) {
    try {
      console.debug('🍎 Safari: Requesting temporary stream for device enumeration...');
      const tempStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      tempStream.getTracks().forEach((track) => {
        track.stop();
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.debug('🍎 Safari: Temporary stream stopped');
    } catch (error) {
      console.warn('⚠️ Could not get temp stream for device enumeration:', error);
    }
  }

  const devices = await navigator.mediaDevices.enumerateDevices();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    const counts = {
      videoinput: devices.filter((d) => d.kind === 'videoinput').length,
      audioinput: devices.filter((d) => d.kind === 'audioinput').length,
      audiooutput: devices.filter((d) => d.kind === 'audiooutput').length,
    };
    console.debug('📱 Device enumeration:', {
      browser: info.name,
      counts,
      hasLabels: devices.every((d) => Boolean(d.label) || d.deviceId === 'default'),
    });
  }

  return devices;
}

// ============================================================================
// Video Utilities
// ============================================================================

/**
 * Safari-kompatibler Autoplay Handler
 * Safari blockiert Autoplay strenger - diese Funktion handled das
 */
export async function playVideoSafely(videoElement: HTMLVideoElement): Promise<boolean> {
  const caps = getBrowserCapabilities();

  try {
    await videoElement.play();
    return true;
  } catch (error) {
    // Safari/iOS: Autoplay blocked, warte auf User Gesture
    if (caps.requiresPlayGesture) {
      console.debug('🍎 Safari/iOS: play() blocked, waiting for user interaction');

      return new Promise<boolean>((resolve) => {
        const playOnInteraction = (): void => {
          videoElement
            .play()
            .then(() => {
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };

        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });

        // Timeout nach 30 Sekunden
        setTimeout(() => {
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
          resolve(false);
        }, 30000);
      });
    }

    console.error('❌ Video play failed:', error);
    return false;
  }
}

/**
 * Safari-kompatibler Stream-Stop
 */
export async function stopStreamSafely(
  stream: MediaStream,
  videoElement?: HTMLVideoElement | null
): Promise<void> {
  const info = getBrowserInfo();
  const caps = getBrowserCapabilities();

  if (
    info.name === 'Safari' &&
    caps.hasKnownCameraReleaseIssue &&
    videoElement !== null &&
    videoElement !== undefined
  ) {
    // Safari: Erst srcObject auf null, dann stoppen (vermeidet Memory Leak)
    videoElement.srcObject = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Safari-kompatibler Track-Stop
 */
export async function stopVideoTrackSafely(
  track: MediaStreamTrack,
  videoElement?: HTMLVideoElement | null
): Promise<void> {
  const info = getBrowserInfo();
  const caps = getBrowserCapabilities();

  if (
    info.name === 'Safari' &&
    caps.hasKnownCameraReleaseIssue &&
    videoElement !== null &&
    videoElement !== undefined
  ) {
    videoElement.srcObject = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  track.stop();
}

/**
 * Get optimale Video Constraints für diesen Browser
 */
export function getOptimalVideoConstraints(): MediaTrackConstraints {
  const info = getBrowserInfo();

  // Safari: Vereinfachte Constraints für bessere Kompatibilität
  if (info.name === 'Safari') {
    return {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: 'user',
    };
  }

  // Chrome/Firefox: Detaillierte Constraints
  return {
    width: { min: 320, ideal: 1280, max: 1920 },
    height: { min: 240, ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user',
  };
}

/**
 * Get optimale Audio Constraints für diesen Browser
 */
export function getOptimalAudioConstraints(): MediaTrackConstraints {
  const info = getBrowserInfo();

  // Safari: Weniger aggressive Audio-Verarbeitung
  if (info.name === 'Safari') {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false, // Safari hat Probleme mit autoGainControl
    };
  }

  // Chrome/Firefox: Vollständige Audio-Verarbeitung
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}

// ============================================================================
// E2EE Compatibility
// ============================================================================

/**
 * Hole E2EE Kompatibilitäts-Info für User-Feedback
 */
export function getE2EECompatibilityInfo(): {
  supported: boolean;
  method: string;
  browser: string;
  version: number;
  message: string;
  recommendation: string | null;
  requiresSafariWorker: boolean;
} {
  const info = getBrowserInfo();
  const caps = getBrowserCapabilities();

  const methodNames: Record<string, string> = {
    encodedStreams: 'Encoded Streams API',
    rtpTransform: 'RTP Transform API',
    scriptTransform: 'Safari Script Transform API',
    none: 'Nicht unterstützt',
  };

  if (caps.supportsInsertableStreams) {
    return {
      supported: true,
      method: methodNames[caps.e2eeMethod],
      browser: info.name,
      version: info.majorVersion,
      message: `✅ E2EE wird unterstützt (${methodNames[caps.e2eeMethod]})`,
      recommendation: null,
      requiresSafariWorker: caps.requiresSafariWorker,
    };
  }

  // Nicht unterstützt - Empfehlung geben
  let recommendation: string;

  if (info.name === 'Safari' && info.majorVersion < 15) {
    recommendation = 'Bitte update Safari auf Version 15.4 oder neuer für E2EE-Unterstützung.';
  } else if (info.name === 'Safari') {
    recommendation = 'Dein Safari unterstützt E2EE mit RTCRtpScriptTransform.';
  } else if (info.name === 'Firefox' && info.majorVersion < 117) {
    recommendation = 'Bitte update Firefox auf Version 117 oder neuer.';
  } else if (info.name === 'Chrome' && info.majorVersion < 86) {
    recommendation = 'Bitte update Chrome auf Version 86 oder neuer.';
  } else if (info.name === 'Edge' && info.majorVersion < 86) {
    recommendation = 'Bitte update Edge auf Version 86 oder neuer.';
  } else {
    recommendation =
      'Für E2EE-Unterstützung nutze Chrome 86+, Firefox 117+, Edge 86+, oder Safari 15.4+.';
  }

  return {
    supported: false,
    method: 'none',
    browser: info.name,
    version: info.majorVersion,
    message: `❌ E2EE nicht unterstützt in ${info.name} ${String(info.majorVersion)}`,
    recommendation,
    requiresSafariWorker: false,
  };
}

/**
 * Check if browser supports specific E2EE feature
 */
export function supportsE2EEFeature(feature: 'video' | 'audio' | 'chat'): boolean {
  const caps = getBrowserCapabilities();

  if (!caps.supportsInsertableStreams) {
    return false;
  }

  // Alle unterstützten Browser können Video/Audio E2EE
  if (feature === 'video' || feature === 'audio') {
    return true;
  }

  // Chat E2EE ist immer möglich (basierend auf Web Crypto API)
  // feature === 'chat' is the only remaining option at this point
  return 'crypto' in window && 'subtle' in crypto;
}

// ============================================================================
// Browser-specific Workarounds
// ============================================================================

/**
 * Apply browser-specific workarounds for media constraints
 */
export function applyBrowserWorkarounds(
  constraints: MediaStreamConstraints
): MediaStreamConstraints {
  const info = getBrowserInfo();

  const result = { ...constraints };

  // Safari: Simplify constraints if they're too complex
  if (info.name === 'Safari') {
    if (typeof constraints.video === 'object') {
      // Safari hat Probleme mit komplexen Video-Constraints
      const videoConstraints = constraints.video;
      if (videoConstraints.width !== undefined || videoConstraints.height !== undefined) {
        // Vereinfache für Safari
        result.video = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 },
          ...videoConstraints,
        };
      }
    }

    // Safari: Deaktiviere autoGainControl wenn Probleme auftreten
    if (typeof constraints.audio === 'object') {
      const audioConstraints = constraints.audio;
      if (audioConstraints.autoGainControl === true) {
        console.debug('🍎 Safari: Disabling autoGainControl for compatibility');
        result.audio = {
          ...audioConstraints,
          autoGainControl: false,
        };
      }
    }
  }

  return result;
}

// ============================================================================
// Debug & Logging
// ============================================================================

/**
 * Log browser information for debugging
 */
export function logBrowserInfo(): void {
  const info = getBrowserInfo();
  console.debug('🌐 Browser Information');
  console.debug('Name:', info.name);
  console.debug('Version:', info.version);
  console.debug('Major Version:', info.majorVersion);
  console.debug(
    'OS:',
    info.isWindows ? 'Windows' : info.isMacOS ? 'macOS' : info.isLinux ? 'Linux' : 'Unknown'
  );
  console.debug('User Agent:', navigator.userAgent);
  console.debug('Mobile:', info.isMobile);
  console.debug('iOS:', info.isIOS);
  console.debug('Android:', info.isAndroid);
  console.debug('---');
}

/**
 * Log browser capabilities for debugging
 */
export function logBrowserCapabilities(): void {
  const caps = getBrowserCapabilities();
  console.debug('🔧 Browser Capabilities');
  console.debug('E2EE Method:', caps.e2eeMethod);
  console.debug('E2EE Supported:', caps.supportsInsertableStreams);
  console.debug('Requires Safari Worker:', caps.requiresSafariWorker);
  console.debug('Audio Output Selection:', caps.supportsAudioOutputSelection);
  console.debug('Screen Share:', caps.supportsGetDisplayMedia);
  console.debug('Requires Play Gesture:', caps.requiresPlayGesture);
  console.debug('Requires getUserMedia before enumerate:', caps.requiresUserMediaBeforeEnumerate);
  console.debug('Video Codecs - VP8:', caps.supportsVP8);
  console.debug('Video Codecs - VP9:', caps.supportsVP9);
  console.debug('Video Codecs - H264:', caps.supportsH264);
  console.debug('---');
}

// ============================================================================
// Export Default
// ============================================================================

export default browserInfo;
