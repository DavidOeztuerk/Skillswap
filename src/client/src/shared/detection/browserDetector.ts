/**
 * Browser Detection - Single Source of Truth
 *
 * Ersetzt alle duplizierten Browser-Detection Implementierungen in der Codebase.
 * Verwendet Caching für Performance.
 *
 * Features:
 * - User Agent parsing mit Feature Detection Fallback
 * - Browser-spezifische Quirks Detection
 * - Private Browsing Mode Detection
 * - WebCrypto/Worker Capability Tests
 */

import type {
  BrowserInfo,
  BrowserName,
  BrowserQuirks,
  CryptoCapabilities,
  WorkerCapabilities,
} from './types';

// ============================================================================
// Cache
// ============================================================================

let cachedBrowserInfo: BrowserInfo | null = null;
let cachedBrowserQuirks: BrowserQuirks | null = null;
let cachedCryptoCapabilities: CryptoCapabilities | null = null;
let cachedWorkerCapabilities: WorkerCapabilities | null = null;
let cachedPrivateBrowsingResult: boolean | null = null;

// ============================================================================
// Internal Detection Functions
// ============================================================================

/**
 * Erkennt den Browser aus dem User Agent
 */
function detectBrowserName(
  ua: string,
  isIOSDevice: boolean
): { name: BrowserName; version: string } {
  // WICHTIG: Reihenfolge ist entscheidend!
  // Safari zuerst prüfen, da Chrome/Edge "Safari" im UA enthalten

  const isSafariUA = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua);
  const isIOSWithoutOthers = isIOSDevice && !/Chrome|Edg|Firefox/i.test(ua);

  if (isSafariUA || isIOSWithoutOthers) {
    let version = /Version\/(\d+(\.\d+)*)/.exec(ua)?.[1] ?? '';
    if (isIOSDevice && !version) {
      const iOSMatch = /OS (\d+)_(\d+)_?(\d+)?/.exec(ua);
      if (iOSMatch) {
        version = `${iOSMatch[1]}.${iOSMatch[2]}`;
      }
    }
    return { name: 'Safari', version };
  }

  if (/Edg\//i.test(ua)) {
    return { name: 'Edge', version: /Edg\/(\d+(\.\d+)*)/.exec(ua)?.[1] ?? '' };
  }

  if (/OPR\/|Opera/i.test(ua)) {
    return { name: 'Opera', version: /(?:OPR|Opera)[/\s](\d+(\.\d+)*)/.exec(ua)?.[1] ?? '' };
  }

  if (/Chrome|Chromium/i.test(ua) && !/Edg/i.test(ua)) {
    return { name: 'Chrome', version: /(?:Chrome|Chromium)\/(\d+(\.\d+)*)/.exec(ua)?.[1] ?? '' };
  }

  if (/Firefox/i.test(ua)) {
    return { name: 'Firefox', version: /Firefox\/(\d+(\.\d+)*)/.exec(ua)?.[1] ?? '' };
  }

  return { name: 'Unknown', version: '' };
}

/**
 * Parst den User Agent und extrahiert Browser-Informationen
 */
function parseUserAgent(): BrowserInfo {
  const ua = navigator.userAgent;

  // Platform Detection
  const mobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const iosDevice =
    /iPhone|iPad|iPod/i.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  const androidDevice = /Android/i.test(ua);
  const macOSDevice = /Mac/i.test(ua) && !iosDevice;
  const windowsDevice = /Win/i.test(ua);
  const linuxDevice = /Linux/i.test(ua) && !androidDevice;

  const { name, version } = detectBrowserName(ua, iosDevice);
  const majorVersion = Number.parseInt(version.split('.')[0], 10) || 0;

  return {
    name,
    version,
    majorVersion,
    isMobile: mobileDevice,
    isIOS: iosDevice,
    isAndroid: androidDevice,
    isMacOS: macOSDevice,
    isWindows: windowsDevice,
    isLinux: linuxDevice,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Gibt Browser-Informationen zurück (cached)
 */
export function getBrowserInfo(): BrowserInfo {
  cachedBrowserInfo ??= parseUserAgent();
  return cachedBrowserInfo;
}

/**
 * Prüft ob es sich um Safari handelt (robuste Erkennung)
 * Kombiniert User Agent Check mit Feature Detection
 */
export function isSafari(): boolean {
  const ua = navigator.userAgent.toLowerCase();

  // WebKit-Feature + Safari im UA OHNE Chrome/Chromium/Edge
  const isWebKit = 'webkitSpeechRecognition' in window || 'webkitAudioContext' in window;
  const hasSafariInUA =
    ua.includes('safari') &&
    !ua.includes('chrome') &&
    !ua.includes('chromium') &&
    !ua.includes('edg');

  return isWebKit && hasSafariInUA;
}

/**
 * Prüft ob es sich um Chrome oder Edge (Chromium-basiert) handelt
 */
export function isChrome(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg');
}

/**
 * Prüft ob es sich um Firefox handelt
 */
export function isFirefox(): boolean {
  return navigator.userAgent.toLowerCase().includes('firefox');
}

/**
 * Prüft ob es sich um Edge handelt
 */
export function isEdge(): boolean {
  return navigator.userAgent.toLowerCase().includes('edg');
}

/**
 * Prüft ob es sich um Opera handelt
 */
export function isOpera(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('opr') || ua.includes('opera');
}

/**
 * Prüft ob es sich um iOS handelt (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  return getBrowserInfo().isIOS;
}

/**
 * Prüft ob es sich um Android handelt
 */
export function isAndroid(): boolean {
  return getBrowserInfo().isAndroid;
}

/**
 * Prüft ob es sich um einen mobilen Browser handelt
 */
export function isMobile(): boolean {
  return getBrowserInfo().isMobile;
}

/**
 * Prüft ob die Browser-Version mindestens die angegebene Version ist
 */
export function isBrowserVersionAtLeast(minMajorVersion: number): boolean {
  return getBrowserInfo().majorVersion >= minMajorVersion;
}

/**
 * Reset Cache (für Tests)
 */
export function resetBrowserInfoCache(): void {
  cachedBrowserInfo = null;
  cachedBrowserQuirks = null;
  cachedCryptoCapabilities = null;
  cachedWorkerCapabilities = null;
  cachedPrivateBrowsingResult = null;
}

// ============================================================================
// Private Browsing Detection
// ============================================================================

// Promise for in-flight private browsing detection
let privateBrowsingPromise: Promise<boolean> | null = null;

/**
 * Erkennt Private Browsing Mode
 * Safari Private Mode: IndexedDB quota ist 0
 * Firefox Private Mode: IndexedDB wirft Error
 * Chrome Incognito: Storage quota ist begrenzt
 */
async function detectPrivateBrowsing(): Promise<boolean> {
  // Safari Private Mode Detection via IndexedDB
  if (isSafari()) {
    return new Promise((resolve) => {
      try {
        const testDB = indexedDB.open('__private_test__');

        const handleError = (): void => {
          resolve(true);
        };
        testDB.addEventListener('error', handleError);

        testDB.addEventListener('success', () => {
          // Safari Private Mode: DB öffnet, aber Operationen schlagen fehl
          try {
            const db = testDB.result;
            // Versuche eine Transaction - schlägt in Private Mode fehl
            const transaction = db.transaction([], 'readonly');
            transaction.addEventListener('complete', () => {
              db.close();
              indexedDB.deleteDatabase('__private_test__');
              resolve(false);
            });
            transaction.addEventListener('error', () => {
              db.close();
              resolve(true);
            });
          } catch {
            resolve(true);
          }
        });
      } catch {
        resolve(true);
      }
    });
  }

  // Firefox Private Mode: localStorage wirft Error in Private Mode
  if (isFirefox()) {
    try {
      localStorage.setItem('__private_test__', 'test');
      localStorage.removeItem('__private_test__');
      return false;
    } catch {
      return true;
    }
  }

  // Chrome Incognito: Storage Quota Check
  if (isChrome() && 'storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      // Chrome Incognito hat typischerweise ~120MB Limit
      // Normal Mode hat mehrere GB
      const quota = estimate.quota ?? 0;
      if (quota > 0 && quota < 200 * 1024 * 1024) {
        return true;
      }
    } catch {
      // Fehler bedeutet wahrscheinlich Private Mode
      return true;
    }
  }

  return false;
}

/**
 * Prüft ob Private Browsing Mode aktiv ist (cached)
 */
export async function isPrivateBrowsing(): Promise<boolean> {
  // Return cached result
  if (cachedPrivateBrowsingResult !== null) {
    return cachedPrivateBrowsingResult;
  }

  // Return in-flight promise to avoid race condition
  if (privateBrowsingPromise !== null) {
    return privateBrowsingPromise;
  }

  // Start detection and cache the promise
  const promise = detectPrivateBrowsing();
  privateBrowsingPromise = promise;

  try {
    const result = await promise;
    // eslint-disable-next-line require-atomic-updates -- Cache update is safe here
    cachedPrivateBrowsingResult = result;
    return result;
  } finally {
    // eslint-disable-next-line require-atomic-updates -- Promise cleanup is safe
    privateBrowsingPromise = null;
  }
}

// ============================================================================
// Browser Quirks Detection
// ============================================================================

/**
 * Erkennt Browser-spezifische Quirks
 *
 * HINWEIS: Die meisten "Safari-Quirks" aus älteren Dokumentationen sind
 * in modernen Versionen (Safari 17+) behoben. Unsere Tests zeigen:
 * - AES-GCM tagLength: funktioniert in Safari 17.6
 * - Worker Message Size: 10MB+ funktioniert ohne Probleme
 * - CryptoKey Transfer: direkter Transfer funktioniert
 */
function detectBrowserQuirks(): BrowserQuirks {
  const safari = isSafari();
  const ios = getBrowserInfo().isIOS;

  return {
    // Safari muss getUserMedia VOR enumerateDevices aufrufen
    requiresUserMediaBeforeEnumerate: safari,

    // Safari hat bekanntes Problem mit Camera-Freigabe nach Call
    hasKnownCameraReleaseIssue: safari,

    // iOS erfordert User Gesture für Autoplay
    requiresPlayGesture: ios,

    // Safari benötigt Key VOR RTCRtpScriptTransform Setup
    requiresKeyBeforeTransform: safari,

    // Safari: removeTrack() muss VOR track.stop() aufgerufen werden
    requiresRemoveTrackBeforeStop: safari,

    // Private Mode: IndexedDB nicht verfügbar (wird async geprüft)
    // Hier erstmal false, wird durch isPrivateBrowsing() async geprüft
    indexedDBUnavailable: false,
  };
}

/**
 * Gibt Browser-Quirks zurück (cached)
 */
export function getBrowserQuirks(): BrowserQuirks {
  cachedBrowserQuirks ??= detectBrowserQuirks();
  return cachedBrowserQuirks;
}

// ============================================================================
// Crypto Capabilities Detection
// ============================================================================

/**
 * Testet ob WebCrypto ECDH unterstützt
 */
async function testECDHSupport(): Promise<boolean> {
  try {
    await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Testet ob WebCrypto AES-GCM unterstützt
 */
async function testAesGcmSupport(): Promise<boolean> {
  try {
    await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Testet ob WebCrypto ECDSA unterstützt
 */
async function testECDSASupport(): Promise<boolean> {
  try {
    await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, [
      'sign',
      'verify',
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Erkennt WebCrypto Capabilities
 */
async function detectCryptoCapabilities(): Promise<CryptoCapabilities> {
  const hasWebCrypto = typeof crypto !== 'undefined';
  const hasSubtleCrypto = hasWebCrypto && typeof crypto.subtle !== 'undefined';
  const isSecure = typeof window !== 'undefined' && window.isSecureContext;

  // Ohne SubtleCrypto können wir keine Tests machen
  if (!hasSubtleCrypto) {
    return {
      hasWebCrypto,
      hasSubtleCrypto: false,
      supportsECDH: false,
      supportsAesGcm: false,
      supportsECDSA: false,
      isSecureContext: isSecure,
      isPrivateBrowsing: await isPrivateBrowsing(),
    };
  }

  // Parallel testen für Performance
  const [supportsECDH, supportsAesGcm, supportsECDSA, privateBrowsing] = await Promise.all([
    testECDHSupport(),
    testAesGcmSupport(),
    testECDSASupport(),
    isPrivateBrowsing(),
  ]);

  return {
    hasWebCrypto,
    hasSubtleCrypto,
    supportsECDH,
    supportsAesGcm,
    supportsECDSA,
    isSecureContext: isSecure,
    isPrivateBrowsing: privateBrowsing,
  };
}

// Promise for in-flight crypto capabilities detection
let cryptoCapabilitiesPromise: Promise<CryptoCapabilities> | null = null;

/**
 * Gibt Crypto Capabilities zurück (cached, async wegen Feature Tests)
 */
export async function getCryptoCapabilities(): Promise<CryptoCapabilities> {
  // Return cached result
  if (cachedCryptoCapabilities !== null) {
    return cachedCryptoCapabilities;
  }

  // Return in-flight promise to avoid race condition
  if (cryptoCapabilitiesPromise !== null) {
    return cryptoCapabilitiesPromise;
  }

  // Start detection and cache the promise
  const promise = detectCryptoCapabilities();
  cryptoCapabilitiesPromise = promise;

  try {
    const result = await promise;
    // eslint-disable-next-line require-atomic-updates -- Cache update is safe here
    cachedCryptoCapabilities = result;
    return result;
  } finally {
    // eslint-disable-next-line require-atomic-updates -- Promise cleanup is safe
    cryptoCapabilitiesPromise = null;
  }
}

// ============================================================================
// Worker Capabilities Detection
// ============================================================================

/**
 * Erkennt Worker Capabilities
 */
function detectWorkerCapabilities(): WorkerCapabilities {
  const supportsWorkers = typeof Worker !== 'undefined';

  // Transferable Objects Test
  let supportsTransferable = false;
  if (supportsWorkers) {
    try {
      // ArrayBuffer ist das Basis-Transferable Object
      const buffer = new ArrayBuffer(1);
      // Wenn postMessage mit transfer list funktioniert, sind Transferables unterstützt
      supportsTransferable = typeof buffer.slice === 'function';
    } catch {
      supportsTransferable = false;
    }
  }

  // SharedArrayBuffer - nur verfügbar mit COOP/COEP Headers
  const supportsSharedArrayBuffer =
    typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined';

  return {
    supportsWorkers,
    supportsTransferable,
    supportsSharedArrayBuffer,
  };
}

/**
 * Gibt Worker Capabilities zurück (cached)
 */
export function getWorkerCapabilities(): WorkerCapabilities {
  cachedWorkerCapabilities ??= detectWorkerCapabilities();
  return cachedWorkerCapabilities;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gibt eine formatierte Zusammenfassung der Browser-Capabilities zurück
 */
export function getBrowserCapabilitiesSummary(): string {
  const browser = getBrowserInfo();
  const workers = getWorkerCapabilities();

  const lines = [
    `Browser: ${browser.name} ${browser.version}`,
    `Platform: ${browser.isMobile ? 'Mobile' : 'Desktop'} (${browser.isIOS ? 'iOS' : browser.isAndroid ? 'Android' : browser.isMacOS ? 'macOS' : browser.isWindows ? 'Windows' : 'Linux'})`,
    `Workers: ${workers.supportsWorkers ? 'Yes' : 'No'}`,
    `SharedArrayBuffer: ${workers.supportsSharedArrayBuffer ? 'Yes' : 'No'}`,
    `Transferable: ${workers.supportsTransferable ? 'Yes' : 'No'}`,
  ];

  return lines.join('\n');
}
