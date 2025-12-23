/**
 * E2EE Browser Support Matrix - KORRIGIERTE VERSION
 * Importiert die richtige getBrowserCapabilities aus browserDetection.ts
 */

import {
  getBrowserInfo,
  getBrowserCapabilities as getFullBrowserCapabilities,
} from '../browserDetection';

export type E2EEMethod = 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';

export interface E2EESupportInfo {
  supported: boolean;
  method: E2EEMethod;
  browserName: string;
  browserVersion: number;
  userMessage: string;
  technicalDetails: string;
  minimumVersion: number;
}

/**
 * Prüft E2EE Support mit detaillierten Infos für ALLE Browser
 */
export function getE2EESupport(): E2EESupportInfo {
  const info = getBrowserInfo();
  const caps = getFullBrowserCapabilities(); // RICHTIGE Funktion!

  // Safari mit RTCRtpScriptTransform
  if (info.name === 'Safari' && caps.supportsRtpScriptTransform) {
    return {
      supported: true,
      method: 'scriptTransform',
      browserName: info.name,
      browserVersion: info.majorVersion,
      userMessage: '✅ Ende-zu-Ende-Verschlüsselung aktiv (Safari)',
      technicalDetails: 'Using RTCRtpScriptTransform API',
      minimumVersion: 15,
    };
  }

  // Safari ohne RTCRtpScriptTransform (zu alt)
  if (info.name === 'Safari' && !caps.supportsRtpScriptTransform) {
    return {
      supported: false,
      method: 'none',
      browserName: info.name,
      browserVersion: info.majorVersion,
      userMessage: '❌ Bitte update Safari auf Version 15.4 oder neuer für E2EE',
      technicalDetails: 'RTCRtpScriptTransform not available',
      minimumVersion: 15,
    };
  }

  // Chrome/Edge mit createEncodedStreams (legacy)
  if (caps.supportsEncodedStreams && !caps.supportsRtpTransform) {
    return {
      supported: true,
      method: 'encodedStreams',
      browserName: info.name,
      browserVersion: info.majorVersion,
      userMessage: '✅ Ende-zu-Ende-Verschlüsselung aktiv',
      technicalDetails: 'Using createEncodedStreams() API',
      minimumVersion: 86,
    };
  }

  // Chrome 118+/Firefox 117+ mit RTCRtpSender.transform
  if (caps.supportsRtpTransform) {
    return {
      supported: true,
      method: 'rtpTransform',
      browserName: info.name,
      browserVersion: info.majorVersion,
      userMessage: '✅ Ende-zu-Ende-Verschlüsselung aktiv',
      technicalDetails: 'Using RTCRtpSender.transform API',
      minimumVersion: info.name === 'Firefox' ? 117 : 118,
    };
  }

  // Nicht unterstützt
  return {
    supported: false,
    method: 'none',
    browserName: info.name,
    browserVersion: info.majorVersion,
    userMessage: getUnsupportedMessage(info.name, info.majorVersion),
    technicalDetails: 'No Insertable Streams API available',
    minimumVersion: getMinimumVersion(info.name),
  };
}

function getUnsupportedMessage(browser: string, version: number): string {
  const minVersion = getMinimumVersion(browser);

  if (version < minVersion) {
    return `❌ Bitte update ${browser} auf Version ${minVersion}+ für E2EE`;
  }

  return `❌ E2EE wird in ${browser} nicht unterstützt`;
}

function getMinimumVersion(browser: string): number {
  switch (browser) {
    case 'Safari':
      return 15;
    case 'Firefox':
      return 117;
    case 'Chrome':
      return 86;
    case 'Edge':
      return 86;
    default:
      return 0;
  }
}

/**
 * Prüft ob E2EE initialisiert werden sollte
 */
export function shouldInitializeE2EE(): {
  initialize: boolean;
  reason: string;
  showWarning: boolean;
  warningMessage: string | null;
} {
  const support = getE2EESupport();

  if (support.supported) {
    return {
      initialize: true,
      reason: support.technicalDetails,
      showWarning: false,
      warningMessage: null,
    };
  }

  return {
    initialize: false,
    reason: support.technicalDetails,
    showWarning: true,
    warningMessage: support.userMessage,
  };
}

/**
 * Gibt Browser-spezifische E2EE Konfiguration zurück
 */
export function getE2EEConfig(): {
  useWorkers: boolean;
  workerType: 'standard' | 'safari' | 'none';
  method: E2EEMethod;
} {
  const support = getE2EESupport();

  if (!support.supported) {
    return {
      useWorkers: false,
      workerType: 'none',
      method: 'none',
    };
  }

  if (support.method === 'scriptTransform') {
    return {
      useWorkers: true,
      workerType: 'safari',
      method: 'scriptTransform',
    };
  }

  return {
    useWorkers: true,
    workerType: 'standard',
    method: support.method,
  };
}
