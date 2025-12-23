/**
 * E2EE Capability Detection - Single Source of Truth
 *
 * Ersetzt alle duplizierten E2EE-Detection Implementierungen (bisher in 4 Dateien!).
 * Bestimmt die richtige E2EE-Methode basierend auf Browser UND Feature Detection.
 */

import { isSafari, isChrome, isFirefox, getBrowserInfo } from './browserDetector';
import type { E2EECapabilities, E2EEMethod } from './types';

// ============================================================================
// Cache
// ============================================================================

let cachedE2EECapabilities: E2EECapabilities | null = null;

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Prüft ob RTCRtpScriptTransform verfügbar ist (Safari 15.4+)
 */
function hasRtpScriptTransform(): boolean {
  return typeof RTCRtpScriptTransform !== 'undefined';
}

/**
 * Prüft ob createEncodedStreams verfügbar ist (Chrome, ältere API)
 */
function hasEncodedStreams(): boolean {
  return typeof RTCRtpSender !== 'undefined' && 'createEncodedStreams' in RTCRtpSender.prototype;
}

/**
 * Prüft ob RTCRtpSender.transform verfügbar ist (Chrome 86+, Firefox 117+)
 */
function hasRtpTransform(): boolean {
  return typeof RTCRtpSender !== 'undefined' && 'transform' in RTCRtpSender.prototype;
}

// ============================================================================
// E2EE Method Detection
// ============================================================================

/**
 * Erkennt E2EE Fähigkeiten des Browsers
 *
 * Priorität der Methoden:
 * 1. Safari mit RTCRtpScriptTransform -> scriptTransform
 * 2. Chrome/Edge mit encodedStreams -> encodedStreams (bevorzugt für Kompatibilität)
 * 3. Chrome/Firefox mit rtpTransform -> rtpTransform
 * 4. Andere Browser mit verfügbaren Features
 */
function detectE2EECapabilities(): E2EECapabilities {
  // Feature Detection
  const supportsRtpScriptTransform = hasRtpScriptTransform();
  const supportsEncodedStreams = hasEncodedStreams();
  const supportsRtpTransform = hasRtpTransform();

  // Methode bestimmen basierend auf Browser UND Features
  let method: E2EEMethod = 'none';
  let needsSafariWorker = false;

  // 1. Safari mit RTCRtpScriptTransform
  if (isSafari() && supportsRtpScriptTransform) {
    method = 'scriptTransform';
    needsSafariWorker = true;
  }
  // 2. Chrome/Edge: encodedStreams BEVORZUGEN (stabiler, besser getestet)
  else if (isChrome() && supportsEncodedStreams) {
    method = 'encodedStreams';
  }
  // 3. Chrome ohne encodedStreams -> Fallback auf rtpTransform
  else if (isChrome() && supportsRtpTransform) {
    method = 'rtpTransform';
  }
  // 4. Firefox: rtpTransform
  else if (isFirefox() && supportsRtpTransform) {
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

  return {
    supported: method !== 'none',
    method,
    supportsEncodedStreams,
    supportsRtpTransform,
    // Nur für echtes Safari true!
    supportsRtpScriptTransform: isSafari() && supportsRtpScriptTransform,
    requiresSafariWorker: needsSafariWorker,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Gibt E2EE Capabilities zurück (cached)
 */
export function getE2EECapabilities(): E2EECapabilities {
  cachedE2EECapabilities ??= detectE2EECapabilities();
  return cachedE2EECapabilities;
}

/**
 * Gibt die zu verwendende E2EE Methode zurück
 */
export function getE2EEMethod(): E2EEMethod {
  return getE2EECapabilities().method;
}

/**
 * Prüft ob E2EE unterstützt wird
 */
export function isE2EESupported(): boolean {
  return getE2EECapabilities().supported;
}

/**
 * Prüft ob Safari Worker benötigt wird
 */
export function requiresSafariWorker(): boolean {
  return getE2EECapabilities().requiresSafariWorker;
}

/**
 * Gibt eine lesbare Beschreibung der E2EE-Methode zurück
 */
export function getE2EEMethodDescription(): string {
  const method = getE2EEMethod();
  const browser = getBrowserInfo();

  switch (method) {
    case 'scriptTransform':
      return `RTCRtpScriptTransform (Safari ${browser.majorVersion})`;
    case 'encodedStreams':
      return `Encoded Streams API (${browser.name} ${browser.majorVersion})`;
    case 'rtpTransform':
      return `RTP Transform API (${browser.name} ${browser.majorVersion})`;
    case 'none':
      return 'Not supported';
    default:
      return 'Unknown';
  }
}

/**
 * Prüft ob E2EE für eine Gruppe bestimmter Größe möglich ist
 * (Mesh-Topologie hat praktische Grenzen)
 *
 * @param participantCount - Anzahl der Teilnehmer
 * @param maxMeshSize - Maximale Teilnehmerzahl für Mesh (default: 6)
 */
export function canSupportE2EEForGroup(
  participantCount: number,
  maxMeshSize = 6
): { supported: boolean; reason?: string } {
  if (!isE2EESupported()) {
    return { supported: false, reason: 'E2EE not supported by this browser' };
  }

  if (participantCount > maxMeshSize) {
    return {
      supported: false,
      reason: `E2EE mesh topology supports max ${maxMeshSize} participants (current: ${participantCount})`,
    };
  }

  return { supported: true };
}

/**
 * Erstellt die Worker-URL basierend auf der E2EE-Methode
 */
export function getE2EEWorkerUrl(): URL | null {
  if (!isE2EESupported()) {
    return null;
  }

  if (requiresSafariWorker()) {
    return new URL('@/workers/e2ee/safari-e2ee-worker.ts', import.meta.url);
  }

  return new URL('@/workers/e2ee/chrome-e2ee-worker.ts', import.meta.url);
}

/**
 * Reset Cache (für Tests)
 */
export function resetE2EECapabilitiesCache(): void {
  cachedE2EECapabilities = null;
}
