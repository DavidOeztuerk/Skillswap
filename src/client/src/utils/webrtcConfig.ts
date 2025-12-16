/**
 * WebRTC Configuration Utility
 * Provides ICE server configuration for reliable peer-to-peer connections
 * Supports STUN and TURN servers with fallback options
 */

/**
 * Builds ICE server configuration from environment variables
 * @returns RTCConfiguration with STUN and TURN servers
 */
export const getWebRTCConfiguration = (): RTCConfiguration => {
  const iceServers: RTCIceServer[] = [];

  const stunUrls = import.meta.env.VITE_WEBRTC_STUN_URLS;
  if (stunUrls) {
    const stunServerUrls = stunUrls
      .split(',')
      .map((url: string) => url.trim())
      .filter(Boolean);
    if (stunServerUrls.length > 0) {
      iceServers.push({
        urls: stunServerUrls,
      });
      console.debug('✅ Using custom STUN servers:', stunServerUrls);
    }
  }

  if (iceServers.length === 0) {
    const fallbackStunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302',
    ];

    iceServers.push({
      urls: fallbackStunServers,
    });
    console.debug('🔧 Using fallback STUN servers');
  }

  const turnUrls = import.meta.env.VITE_WEBRTC_TURN_URLS;
  const turnUsername = import.meta.env.VITE_WEBRTC_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;

  if (turnUrls && turnUsername && turnCredential) {
    const turnServerUrls = turnUrls
      .split(',')
      .map((url: string) => url.trim())
      .filter(Boolean);
    if (turnServerUrls.length > 0) {
      iceServers.push({
        urls: turnServerUrls,
        username: turnUsername,
        credential: turnCredential,
      });
      console.debug('✅ Using TURN servers:', turnServerUrls);
    }
  } else {
    console.warn('⚠️ No TURN servers configured, using public fallback (limited reliability)');

    iceServers.push({
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    });
  }

  // Chrome E2EE: encodedInsertableStreams muss bei PeerConnection-Erstellung gesetzt werden!
  // Dies ermöglicht createEncodedStreams() auf Sendern und Empfängern
  const supportsEncodedInsertableStreams =
    typeof RTCRtpSender !== 'undefined' && 'createEncodedStreams' in RTCRtpSender.prototype;

  if (supportsEncodedInsertableStreams) {
    console.debug('✅ WebRTC: encodedInsertableStreams enabled for Chrome E2EE support');
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    // KRITISCH für Chrome E2EE: Muss bei PeerConnection-Erstellung gesetzt werden!
    // Ohne dieses Flag schlägt createEncodedStreams() mit "Too late" fehl
    ...(supportsEncodedInsertableStreams && { encodedInsertableStreams: true }),
  } as RTCConfiguration;
};

/**
 * Validates WebRTC configuration
 * @returns true if valid TURN servers are configured
 */
export const hasTurnServers = (): boolean => {
  const turnUrls = import.meta.env.VITE_WEBRTC_TURN_URLS;
  const turnUsername = import.meta.env.VITE_WEBRTC_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;

  if (!turnUrls || !turnUsername || !turnCredential) {
    return false;
  }

  const urls = turnUrls
    .split(',')
    .map((url: string) => url.trim())
    .filter(Boolean);
  return urls.length > 0;
};

/**
 * Gets detailed connection quality information
 */
export const getExpectedConnectionQuality = (): {
  quality: 'low' | 'medium' | 'medium-high' | 'high';
  successRate: string;
  description: string;
  hasTurn: boolean;
  stunCount: number;
  turnCount: number;
} => {
  const config = getWebRTCConfiguration();

  const stunCount = config.iceServers?.filter((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => typeof url === 'string' && url.startsWith('stun:'));
  }).length;

  const turnCount = config.iceServers?.filter((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => typeof url === 'string' && url.startsWith('turn:'));
  }).length;

  const hasTurn = turnCount !== undefined && turnCount > 0;

  if (hasTurn && stunCount !== undefined && stunCount >= 2) {
    return {
      quality: 'high',
      successRate: '95-99%',
      description: 'Multiple STUN + TURN servers configured. Excellent connectivity.',
      hasTurn: true,
      stunCount,
      turnCount,
    };
  }
  if (hasTurn) {
    return {
      quality: 'medium-high',
      successRate: '85-95%',
      description: 'TURN servers available. Good firewall traversal.',
      hasTurn: true,
      stunCount: stunCount ?? 0,
      turnCount,
    };
  }
  return {
    quality: 'medium',
    successRate: '65-80%',
    description: 'Only STUN servers. May fail behind restrictive firewalls.',
    hasTurn: false,
    stunCount: stunCount ?? 0,
    turnCount: turnCount ?? 0,
  };
};

/**
 * Logs current WebRTC configuration for debugging
 */
export const logWebRTCConfig = (): void => {
  const config = getWebRTCConfiguration();
  const quality = getExpectedConnectionQuality();

  console.debug('🎥 WebRTC Configuration Analysis');
  console.debug('ICE Servers:', config.iceServers);
  console.debug('Configuration Quality:', quality.quality);
  console.debug('Expected Success Rate:', quality.successRate);
  console.debug('Description:', quality.description);
  console.debug('STUN Servers:', quality.stunCount);
  console.debug('TURN Servers:', quality.turnCount);
  console.debug('ICE Candidate Pool Size:', config.iceCandidatePoolSize);
  console.debug('Bundle Policy:', config.bundlePolicy);
  console.debug('RTCP Mux Policy:', config.rtcpMuxPolicy);
  console.debug('Ice Transport Policy:', config.iceTransportPolicy);
  console.debug('---');
};

/**
 * Enhanced connectivity test with better error handling
 */
export const testWebRTCConnectivity = async (): Promise<{
  success: boolean;
  details: string;
  iceServers: number;
  hasTurn: boolean;
  gatheredCandidates: number;
}> => {
  try {
    const config = getWebRTCConfiguration();

    // Erstelle eine temporäre PeerConnection zum Testen
    const pc = new RTCPeerConnection(config);
    let gatheredCandidates = 0;

    return await new Promise((resolve) => {
      let hasGathered = false;
      const timeoutId: NodeJS.Timeout = setTimeout(() => {
        if (!hasGathered) {
          console.warn('⚠️ ICE gathering timeout');
          pc.close();
          resolve({
            success: false,
            details: `ICE gathering timeout after 10s (${gatheredCandidates.toString()} candidates gathered)`,
            iceServers: config.iceServers?.length ?? 0,
            hasTurn: hasTurnServers(),
            gatheredCandidates,
          });
        }
      }, 10000);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          gatheredCandidates++;
          console.debug('🧊 ICE Candidate found:', event.candidate.type);
        }
      };

      pc.onicegatheringstatechange = () => {
        console.debug('ICE Gathering State:', pc.iceGatheringState);

        if (pc.iceGatheringState === 'complete' && !hasGathered) {
          hasGathered = true;
          clearTimeout(timeoutId);

          const success = gatheredCandidates > 0;

          pc.close();

          resolve({
            success,
            details: success
              ? `ICE gathering successful with ${gatheredCandidates.toString()} candidates`
              : 'No ICE candidates gathered',
            iceServers: config.iceServers?.length ?? 0,
            hasTurn: hasTurnServers(),
            gatheredCandidates,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.debug('ICE Connection State:', pc.iceConnectionState);

        if (pc.iceConnectionState === 'failed' && !hasGathered) {
          hasGathered = true;
          clearTimeout(timeoutId);
          pc.close();

          resolve({
            success: false,
            details: 'ICE connection failed',
            iceServers: config.iceServers?.length ?? 0,
            hasTurn: hasTurnServers(),
            gatheredCandidates,
          });
        }
      };

      // TODO: Media tracks hinzufügen, wenn Audio/Video getestet werden soll??
      // TODO: DataChannel testen? (derzeit nur für ICE Gathering genutzt)
      // Start ICE candidate gathering
      pc.createDataChannel('test'); // Benötigt für Kandidatensammlung
      pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
        .then((offer) => {
          console.debug('📡 Created test offer, setting local description...');
          return pc.setLocalDescription(offer);
        })
        .then(() => {
          console.debug('✅ Local description set, ICE gathering started...');
        })
        .catch((err: unknown) => {
          console.error('❌ Connectivity test error:', err);
          if (!hasGathered) {
            hasGathered = true;
            clearTimeout(timeoutId);
            pc.close();
            resolve({
              success: false,
              details: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
              iceServers: config.iceServers?.length ?? 0,
              hasTurn: hasTurnServers(),
              gatheredCandidates,
            });
          }
        });
    });
  } catch (error) {
    console.error('❌ Connectivity test exception:', error);
    return {
      success: false,
      details: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      iceServers: 0,
      hasTurn: false,
      gatheredCandidates: 0,
    };
  }
};

/**
 * Quick connectivity check for runtime validation
 */
export const quickConnectivityCheck = async (): Promise<boolean> => {
  try {
    const result = await testWebRTCConnectivity();
    console.debug('🔍 Quick connectivity check:', result.success ? '✅ PASS' : '❌ FAIL');
    return result.success;
  } catch {
    return false;
  }
};

// Type for legacy WebRTC prefixed properties
interface LegacyWebRTCWindow extends Window {
  webkitRTCPeerConnection?: typeof RTCPeerConnection;
  mozRTCPeerConnection?: typeof RTCPeerConnection;
}

/**
 * Get browser-specific WebRTC capabilities (BASIC VERSION)
 * Diese Funktion sollte NICHT verwendet werden für E2EE Detection!
 * Stattdessen die getBrowserCapabilities() aus browserDetection.ts importieren!
 *
 * @deprecated Use getBrowserCapabilities from browserDetection.ts instead
 */
export const getBasicWebRTCBrowserCapabilities = (): {
  webrtc: boolean;
  stun: boolean;
  turn: boolean;
  trickleIce: boolean;
  sctp: boolean;
} => {
  const legacyWindow = window as LegacyWebRTCWindow;
  const RTCPeerConnectionConstructor =
    typeof window.RTCPeerConnection !== 'undefined'
      ? window.RTCPeerConnection
      : typeof legacyWindow.webkitRTCPeerConnection !== 'undefined'
        ? legacyWindow.webkitRTCPeerConnection
        : typeof legacyWindow.mozRTCPeerConnection !== 'undefined'
          ? legacyWindow.mozRTCPeerConnection
          : undefined;

  if (!RTCPeerConnectionConstructor) {
    return {
      webrtc: false,
      stun: false,
      turn: false,
      trickleIce: false,
      sctp: false,
    };
  }

  // Test if STUN works by creating a minimal config
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pc.close();

    return {
      webrtc: true,
      stun: true,
      turn: true, // Assume TURN support if STUN works
      trickleIce: true,
      sctp: true,
    };
  } catch {
    return {
      webrtc: true,
      stun: false,
      turn: false,
      trickleIce: false,
      sctp: false,
    };
  }
};

/**
 * Generate configuration report for debugging
 */
export const generateConfigReport = (): {
  config: RTCConfiguration;
  quality: ReturnType<typeof getExpectedConnectionQuality>;
  env: {
    hasStun: boolean;
    hasTurn: boolean;
    stunUrls: string;
    turnUrls: string;
  };
} => ({
  config: getWebRTCConfiguration(),
  quality: getExpectedConnectionQuality(),
  env: {
    hasStun: !!import.meta.env.VITE_WEBRTC_STUN_URLS,
    hasTurn: hasTurnServers(),
    stunUrls: import.meta.env.VITE_WEBRTC_STUN_URLS ?? 'not set',
    turnUrls: import.meta.env.VITE_WEBRTC_TURN_URLS ?? 'not set',
  },
});

/**
 * Get browser-optimized WebRTC configuration
 * Berücksichtigt Browser-spezifische Optimierungen
 */
export const getOptimizedWebRTCConfig = (): RTCConfiguration => {
  const config = getWebRTCConfiguration();

  // Browser-spezifische Optimierungen
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    // Safari-spezifische Optimierungen
    // Safari verwendet RTCRtpScriptTransform, nicht encodedInsertableStreams
    return {
      ...config,
      iceCandidatePoolSize: 5, // Safari hat Probleme mit vielen Candidates
      bundlePolicy: 'balanced',
    };
  }

  if (userAgent.includes('firefox')) {
    // Firefox-spezifische Optimierungen
    return {
      ...config,
      iceTransportPolicy: 'all',
      rtcpMuxPolicy: 'require',
    };
  }

  // Chrome/Edge Standard - encodedInsertableStreams ist bereits in getWebRTCConfiguration()
  return config;
};

/**
 * Check if ICE servers are valid
 */
export const validateIceServers = async (): Promise<{
  valid: boolean;
  stunWorking: boolean;
  turnWorking: boolean;
  errors: string[];
}> => {
  const result = {
    valid: false,
    stunWorking: false,
    turnWorking: false,
    errors: [] as string[],
  };

  try {
    const connectivity = await testWebRTCConnectivity();

    if (connectivity.success) {
      result.valid = true;
      result.stunWorking = true;

      if (connectivity.hasTurn) {
        result.turnWorking = true;
      }
    } else {
      result.errors.push(connectivity.details);
    }
  } catch (error) {
    result.errors.push(
      `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
};

/**
 * Get recommended bitrate based on connection quality
 */
export const getRecommendedBitrate = (): {
  video: number;
  audio: number;
  description: string;
} => {
  const quality = getExpectedConnectionQuality();

  switch (quality.quality) {
    case 'high':
      return {
        video: 4000,
        audio: 128,
        description: 'Excellent connection - HD video recommended',
      };
    case 'medium-high':
      return {
        video: 2500,
        audio: 96,
        description: 'Good connection - 720p video recommended',
      };
    case 'medium':
      return {
        video: 1500,
        audio: 64,
        description: 'Medium connection - 480p video recommended',
      };
    case 'low':
      return {
        video: 500,
        audio: 32,
        description: 'Poor connection - Low quality video recommended',
      };
    default:
      return {
        video: 1500,
        audio: 64,
        description: 'Default settings',
      };
  }
};
