/**
 * Browser Detection - Single Source of Truth
 *
 * Ersetzt alle duplizierten Browser-Detection Implementierungen in der Codebase.
 * Verwendet Caching für Performance.
 */

import type { BrowserInfo, BrowserName } from './types';

// ============================================================================
// Cache
// ============================================================================

let cachedBrowserInfo: BrowserInfo | null = null;

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
}
