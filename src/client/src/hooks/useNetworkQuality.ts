import { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkQualityStats {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  packetsLost: number;
  jitter: number;
  roundTripTime: number;
  bandwidth: number; // kbps
  lastUpdate: Date;
}

export interface NetworkQualityOptions {
  interval?: number; // How often to check (ms)
  enableLogging?: boolean;
}

/**
 * Network Quality Monitoring Hook
 * Monitors WebRTC connection quality and provides real-time feedback
 * @param peerConnection - The WebRTC peer connection to monitor
 * @param options - Configuration options for monitoring interval and logging
 */
export const useNetworkQuality = (
  peerConnection: RTCPeerConnection | null,
  options: NetworkQualityOptions = {}
) => {
  const { interval = 2000, enableLogging = false } = options;

  const [stats, setStats] = useState<NetworkQualityStats>({
    quality: 'unknown',
    packetsLost: 0,
    jitter: 0,
    roundTripTime: 0,
    bandwidth: 0,
    lastUpdate: new Date(),
  });

  const previousStatsRef = useRef<any>(null);

  const calculateQuality = useCallback((
    packetsLost: number,
    jitter: number,
    rtt: number
  ): NetworkQualityStats['quality'] => {
    // Quality scoring based on packet loss, jitter, and RTT
    let score = 100;

    // Packet loss penalty (most critical)
    if (packetsLost > 5) score -= 50;
    else if (packetsLost > 2) score -= 30;
    else if (packetsLost > 0) score -= 10;

    // Jitter penalty (affects audio quality)
    if (jitter > 50) score -= 20;
    else if (jitter > 30) score -= 10;
    else if (jitter > 15) score -= 5;

    // RTT penalty (affects interactivity)
    if (rtt > 300) score -= 20;
    else if (rtt > 150) score -= 10;
    else if (rtt > 100) score -= 5;

    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }, []);

  const analyzeStats = useCallback(async () => {
    if (!peerConnection || peerConnection.connectionState !== 'connected') {
      return;
    }

    try {
      const statsReport = await peerConnection.getStats();
      let packetsLost = 0;
      let jitter = 0;
      let rtt = 0;
      let bandwidth = 0;

      statsReport.forEach((report) => {
        // Inbound RTP stream stats (receiving)
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          packetsLost += report.packetsLost || 0;
          jitter += report.jitter || 0;

          // Calculate bandwidth from bytes received
          if (previousStatsRef.current) {
            const prevReport = previousStatsRef.current.get(report.id);
            if (prevReport && report.bytesReceived && prevReport.bytesReceived) {
              const bytesReceived = report.bytesReceived - prevReport.bytesReceived;
              const timeDiff = report.timestamp - prevReport.timestamp;
              if (timeDiff > 0) {
                bandwidth = (bytesReceived * 8) / (timeDiff / 1000) / 1000; // kbps
              }
            }
          }
        }

        // Candidate pair for RTT
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0; // Convert to ms
        }
      });

      // Store current stats for next comparison
      previousStatsRef.current = statsReport;

      const quality = calculateQuality(packetsLost, jitter, rtt);

      const newStats: NetworkQualityStats = {
        quality,
        packetsLost,
        jitter: Math.round(jitter * 1000), // Convert to ms
        roundTripTime: Math.round(rtt),
        bandwidth: Math.round(bandwidth),
        lastUpdate: new Date(),
      };

      setStats(newStats);

      if (enableLogging) {
        console.log('📊 [NetworkQuality]', {
          quality,
          packetsLost,
          jitter: `${newStats.jitter}ms`,
          rtt: `${newStats.roundTripTime}ms`,
          bandwidth: `${newStats.bandwidth}kbps`,
        });
      }

      // Warn if quality is poor
      if (quality === 'poor') {
        console.warn('⚠️ [NetworkQuality] Poor connection quality detected', newStats);
      }
    } catch (error) {
      console.error('❌ [NetworkQuality] Error analyzing stats:', error);
    }
  }, [peerConnection, calculateQuality, enableLogging]);

  useEffect(() => {
    if (!peerConnection) {
      return;
    }

    console.log('📊 [NetworkQuality] Starting network quality monitoring');

    const intervalId = setInterval(analyzeStats, interval);

    // Initial analysis
    analyzeStats();

    return () => {
      console.log('📊 [NetworkQuality] Stopping network quality monitoring');
      clearInterval(intervalId);
    };
  }, [peerConnection, interval, analyzeStats]);

  return stats;
};
