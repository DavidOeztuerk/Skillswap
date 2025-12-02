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
    const stunServerUrls = stunUrls.split(',').map((url: string) => url.trim()).filter((url: any) => url);
    if (stunServerUrls.length > 0) {
      iceServers.push({
        urls: stunServerUrls,
      });
      console.log('✅ Using custom STUN servers:', stunServerUrls);
    }
  }

  if (iceServers.length === 0) {
    const fallbackStunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302'
    ];
    
    iceServers.push({
      urls: fallbackStunServers,
    });
    console.log('🔧 Using fallback STUN servers');
  }

  const turnUrls = import.meta.env.VITE_WEBRTC_TURN_URLS;
  const turnUsername = import.meta.env.VITE_WEBRTC_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;

  if (turnUrls && turnUsername && turnCredential) {
    const turnServerUrls = turnUrls.split(',').map((url: string) => url.trim()).filter((url: any) => url);
    if (turnServerUrls.length > 0) {
      iceServers.push({
        urls: turnServerUrls,
        username: turnUsername,
        credential: turnCredential,
      });
      console.log('✅ Using TURN servers:', turnServerUrls);
    }
  } else {
    console.warn('⚠️ No TURN servers configured, using public fallback (limited reliability)');
    
    iceServers.push({
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    });
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
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

  const urls = turnUrls.split(',').map((url: string) => url.trim()).filter((url: any) => url);
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
  
  const stunCount = config.iceServers?.filter(server => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some(url => typeof url === 'string' && url.startsWith('stun:'));
  }).length;
  
  const turnCount = config.iceServers?.filter(server => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some(url => typeof url === 'string' && url.startsWith('turn:'));
  }).length;

  const hasTurn = turnCount !== undefined && turnCount > 0;

  if (hasTurn && stunCount !== undefined && stunCount >= 2) {
    return {
      quality: 'high',
      successRate: '95-99%',
      description: 'Multiple STUN + TURN servers configured. Excellent connectivity.',
      hasTurn: true,
      stunCount,
      turnCount
    };
  } else if (hasTurn) {
    return {
      quality: 'medium-high',
      successRate: '85-95%',
      description: 'TURN servers available. Good firewall traversal.',
      hasTurn: true,
      stunCount: stunCount ?? 0,
      turnCount: turnCount
    };
  } else {
    return {
      quality: 'medium',
      successRate: '65-80%',
      description: 'Only STUN servers. May fail behind restrictive firewalls.',
      hasTurn: false,
      stunCount: stunCount ?? 0,
      turnCount: turnCount ?? 0
    };
  }
};

/**
 * Logs current WebRTC configuration for debugging
 */
export const logWebRTCConfig = (): void => {
  const config = getWebRTCConfiguration();
  const quality = getExpectedConnectionQuality();
  
  console.group('🎥 WebRTC Configuration Analysis');
  console.log('ICE Servers:', config.iceServers);
  console.log('Configuration Quality:', quality.quality);
  console.log('Expected Success Rate:', quality.successRate);
  console.log('Description:', quality.description);
  console.log('STUN Servers:', quality.stunCount);
  console.log('TURN Servers:', quality.turnCount);
  console.log('ICE Candidate Pool Size:', config.iceCandidatePoolSize);
  console.log('Bundle Policy:', config.bundlePolicy);
  console.log('RTCP Mux Policy:', config.rtcpMuxPolicy);
  console.log('Ice Transport Policy:', config.iceTransportPolicy);
  console.groupEnd();
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

    return new Promise((resolve) => {
      let hasGathered = false;
      let timeoutId: NodeJS.Timeout;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          gatheredCandidates++;
          console.log('🧊 ICE Candidate found:', event.candidate.type);
        }
      };
      
      pc.onicegatheringstatechange = () => {
        console.log('ICE Gathering State:', pc.iceGatheringState);
        
        if (pc.iceGatheringState === 'complete' && !hasGathered) {
          hasGathered = true;
          clearTimeout(timeoutId);
          
          const success = gatheredCandidates > 0;
          
          pc.close();
          
          resolve({
            success,
            details: success 
              ? `ICE gathering successful with ${gatheredCandidates} candidates` 
              : 'No ICE candidates gathered',
            iceServers: config.iceServers?.length ?? 0,
            hasTurn: hasTurnServers(),
            gatheredCandidates
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'failed' && !hasGathered) {
          hasGathered = true;
          clearTimeout(timeoutId);
          pc.close();
          
          resolve({
            success: false,
            details: 'ICE connection failed',
            iceServers: config.iceServers?.length ?? 0,
            hasTurn: hasTurnServers(),
            gatheredCandidates
          });
        }
      };
      
      // Timeout nach 10 Sekunden (länger für TURN)
      timeoutId = setTimeout(() => {
        if (!hasGathered) {
          console.warn('⚠️ ICE gathering timeout');
          pc.close();
          resolve({
            success: false,
            details: `ICE gathering timeout after 10s (${gatheredCandidates} candidates gathered)`,
            iceServers: config.iceServers?.length ?? 0,
            hasTurn: hasTurnServers(),
            gatheredCandidates
          });
        }
      }, 10000);
      
      // Start ICE candidate gathering
      pc.createDataChannel('test'); // Benötigt für Kandidatensammlung
      pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
        .then(offer => {
          console.log('📡 Created test offer, setting local description...');
          return pc.setLocalDescription(offer);
        })
        .then(() => {
          console.log('✅ Local description set, ICE gathering started...');
        })
        .catch(err => {
          console.error('❌ Connectivity test error:', err);
          if (!hasGathered) {
            hasGathered = true;
            clearTimeout(timeoutId);
            pc.close();
            resolve({
              success: false,
              details: `Error: ${err.message}`,
              iceServers: config.iceServers?.length ?? 0,
              hasTurn: hasTurnServers(),
              gatheredCandidates
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
      gatheredCandidates: 0
    };
  }
};

/**
 * Quick connectivity check for runtime validation
 */
export const quickConnectivityCheck = async (): Promise<boolean> => {
  try {
    const result = await testWebRTCConnectivity();
    console.log('🔍 Quick connectivity check:', result.success ? '✅ PASS' : '❌ FAIL');
    return result.success;
  } catch {
    return false;
  }
};

/**
 * Get browser-specific WebRTC capabilities
 */
export const getBrowserCapabilities = (): {
  webrtc: boolean;
  stun: boolean;
  turn: boolean;
  trickleIce: boolean;
  sctp: boolean;
} => {
  const RTCPeerConnection = window.RTCPeerConnection || 
                           // @ts-ignore
                           window.webkitRTCPeerConnection || 
                           // @ts-ignore  
                           window.mozRTCPeerConnection;

  if (!RTCPeerConnection) {
    return {
      webrtc: false,
      stun: false,
      turn: false,
      trickleIce: false,
      sctp: false
    };
  }

  // Test if STUN works by creating a minimal config
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pc.close();
    
    return {
      webrtc: true,
      stun: true,
      turn: true, // Assume TURN support if STUN works
      trickleIce: true,
      sctp: true
    };
  } catch {
    return {
      webrtc: true,
      stun: false,
      turn: false,
      trickleIce: false,
      sctp: false
    };
  }
};

/**
 * Generate configuration report for debugging
 */
export const generateConfigReport = (): {
  config: RTCConfiguration;
  quality: ReturnType<typeof getExpectedConnectionQuality>;
  browser: ReturnType<typeof getBrowserCapabilities>;
  env: {
    hasStun: boolean;
    hasTurn: boolean;
    stunUrls: string;
    turnUrls: string;
  };
} => {
  return {
    config: getWebRTCConfiguration(),
    quality: getExpectedConnectionQuality(),
    browser: getBrowserCapabilities(),
    env: {
      hasStun: !!import.meta.env.VITE_WEBRTC_STUN_URLS,
      hasTurn: hasTurnServers(),
      stunUrls: import.meta.env.VITE_WEBRTC_STUN_URLS || 'not set',
      turnUrls: import.meta.env.VITE_WEBRTC_TURN_URLS || 'not set'
    }
  };
};