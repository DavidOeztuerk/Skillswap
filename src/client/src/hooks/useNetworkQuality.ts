import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface NetworkQualityStats {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  // Video Stats
  videoPacketsLost: number;
  videoPacketsLostPerSecond: number;
  videoJitter: number;
  videoBandwidth: number;
  // Audio Stats
  audioPacketsLost: number;
  audioPacketsLostPerSecond: number;
  audioJitter: number;
  audioBandwidth: number;
  // Combined
  roundTripTime: number;
  totalBandwidth: number;
  lastUpdate: Date;
}

export interface NetworkQualityOptions {
  /** How often to check (ms) - default 2000 */
  interval?: number;
  /** Enable console logging */
  enableLogging?: boolean;
  /** Callback when quality changes */
  onQualityChange?: (quality: NetworkQualityStats['quality']) => void;
}

interface PreviousStats {
  timestamp: number;
  videoPacketsLost: number;
  audioPacketsLost: number;
  videoBytesReceived: number;
  audioBytesReceived: number;
}

// WebRTC Stats Report types (typed subset of RTCStats)
interface RTCInboundRtpStats {
  type: 'inbound-rtp';
  kind: 'video' | 'audio';
  packetsLost?: number;
  jitter?: number;
  bytesReceived?: number;
  timestamp: number;
}

interface RTCCandidatePairStats {
  type: 'candidate-pair';
  state: string;
  currentRoundTripTime?: number;
}

type WebRTCStatsReport = RTCInboundRtpStats | RTCCandidatePairStats | { type: string };

// ============================================================================
// Initial State
// ============================================================================

const initialStats: NetworkQualityStats = {
  quality: 'unknown',
  videoPacketsLost: 0,
  videoPacketsLostPerSecond: 0,
  videoJitter: 0,
  videoBandwidth: 0,
  audioPacketsLost: 0,
  audioPacketsLostPerSecond: 0,
  audioJitter: 0,
  audioBandwidth: 0,
  roundTripTime: 0,
  totalBandwidth: 0,
  lastUpdate: new Date(),
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Network Quality Monitoring Hook
 * Monitors WebRTC connection quality and provides real-time feedback
 *
 * @param peerConnection - The WebRTC peer connection to monitor
 * @param options - Configuration options
 * @returns NetworkQualityStats with current connection quality metrics
 */
export const useNetworkQuality = (
  peerConnection: RTCPeerConnection | null,
  options: NetworkQualityOptions = {}
): NetworkQualityStats => {
  const { interval = 2000, enableLogging = false, onQualityChange } = options;

  const [stats, setStats] = useState<NetworkQualityStats>(initialStats);

  // Refs for cleanup and tracking
  const previousStatsRef = useRef<PreviousStats | null>(null);
  const isMountedRef = useRef(true);
  const previousQualityRef = useRef<NetworkQualityStats['quality']>('unknown');
  const onQualityChangeRef = useRef(onQualityChange);

  // Keep callback ref current
  useEffect(() => {
    onQualityChangeRef.current = onQualityChange;
  }, [onQualityChange]);

  /**
   * Calculate quality score based on metrics
   */
  const calculateQuality = useCallback(
    (
      videoPacketsLostPerSec: number,
      audioPacketsLostPerSec: number,
      videoJitter: number,
      audioJitter: number,
      rtt: number
    ): NetworkQualityStats['quality'] => {
      let score = 100;

      // Audio Packet Loss (most critical for calls)
      if (audioPacketsLostPerSec > 3) score -= 40;
      else if (audioPacketsLostPerSec > 1) score -= 20;
      else if (audioPacketsLostPerSec > 0) score -= 5;

      // Video Packet Loss
      if (videoPacketsLostPerSec > 5) score -= 30;
      else if (videoPacketsLostPerSec > 2) score -= 15;
      else if (videoPacketsLostPerSec > 0) score -= 5;

      // Audio Jitter (critical for voice clarity)
      if (audioJitter > 50) score -= 25;
      else if (audioJitter > 30) score -= 15;
      else if (audioJitter > 15) score -= 5;

      // Video Jitter
      if (videoJitter > 100) score -= 15;
      else if (videoJitter > 50) score -= 10;
      else if (videoJitter > 30) score -= 5;

      // Round Trip Time
      if (rtt > 400) score -= 25;
      else if (rtt > 200) score -= 15;
      else if (rtt > 100) score -= 5;

      if (score >= 80) return 'excellent';
      if (score >= 60) return 'good';
      if (score >= 40) return 'fair';
      return 'poor';
    },
    []
  );

  /**
   * Analyze WebRTC stats
   */
  const analyzeStats = useCallback(async () => {
    // Early return checks
    if (!peerConnection) return;
    if (peerConnection.connectionState !== 'connected') return;
    if (!isMountedRef.current) return;

    try {
      const statsReport = await peerConnection.getStats();

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ref can change between async operations
      if (!isMountedRef.current) return;

      let videoPacketsLost = 0;
      let videoJitter = 0;
      let videoBytesReceived = 0;
      let audioPacketsLost = 0;
      let audioJitter = 0;
      let audioBytesReceived = 0;
      let rtt = 0;
      let timestamp = Date.now();

      statsReport.forEach((report: WebRTCStatsReport) => {
        // Video Inbound Stats
        if (report.type === 'inbound-rtp') {
          const rtpStats = report as RTCInboundRtpStats;
          if (rtpStats.kind === 'video') {
            videoPacketsLost = rtpStats.packetsLost ?? 0;
            videoJitter = (rtpStats.jitter ?? 0) * 1000; // Convert to ms
            videoBytesReceived = rtpStats.bytesReceived ?? 0;
            timestamp = rtpStats.timestamp;
          }
          if (rtpStats.kind === 'audio') {
            audioPacketsLost = rtpStats.packetsLost ?? 0;
            audioJitter = (rtpStats.jitter ?? 0) * 1000;
            audioBytesReceived = rtpStats.bytesReceived ?? 0;
          }
        }

        // RTT from candidate pair
        if (report.type === 'candidate-pair') {
          const pairStats = report as RTCCandidatePairStats;
          if (pairStats.state === 'succeeded') {
            rtt =
              pairStats.currentRoundTripTime !== undefined
                ? pairStats.currentRoundTripTime * 1000
                : 0;
          }
        }
      });

      let videoPacketsLostPerSecond = 0;
      let audioPacketsLostPerSecond = 0;
      let videoBandwidth = 0;
      let audioBandwidth = 0;

      if (previousStatsRef.current) {
        const timeDiffSec = (timestamp - previousStatsRef.current.timestamp) / 1000;

        if (timeDiffSec > 0) {
          // Packets lost per second (Delta, not cumulative)
          videoPacketsLostPerSecond = Math.max(
            0,
            (videoPacketsLost - previousStatsRef.current.videoPacketsLost) / timeDiffSec
          );
          audioPacketsLostPerSecond = Math.max(
            0,
            (audioPacketsLost - previousStatsRef.current.audioPacketsLost) / timeDiffSec
          );

          // Bandwidth in kbps
          const videoBytesDelta = videoBytesReceived - previousStatsRef.current.videoBytesReceived;
          const audioBytesDelta = audioBytesReceived - previousStatsRef.current.audioBytesReceived;

          videoBandwidth = (videoBytesDelta * 8) / timeDiffSec / 1000;
          audioBandwidth = (audioBytesDelta * 8) / timeDiffSec / 1000;
        }
      }

      // Store for next iteration
      previousStatsRef.current = {
        timestamp,
        videoPacketsLost,
        audioPacketsLost,
        videoBytesReceived,
        audioBytesReceived,
      };

      const quality = calculateQuality(
        videoPacketsLostPerSecond,
        audioPacketsLostPerSecond,
        videoJitter,
        audioJitter,
        rtt
      );

      const newStats: NetworkQualityStats = {
        quality,
        videoPacketsLost,
        videoPacketsLostPerSecond: Math.round(videoPacketsLostPerSecond * 10) / 10,
        videoJitter: Math.round(videoJitter),
        videoBandwidth: Math.round(videoBandwidth),
        audioPacketsLost,
        audioPacketsLostPerSecond: Math.round(audioPacketsLostPerSecond * 10) / 10,
        audioJitter: Math.round(audioJitter),
        audioBandwidth: Math.round(audioBandwidth),
        roundTripTime: Math.round(rtt),
        totalBandwidth: Math.round(videoBandwidth + audioBandwidth),
        lastUpdate: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ref can change between async operations
      if (isMountedRef.current) {
        setStats(newStats);

        // Trigger callback on quality change
        if (quality !== previousQualityRef.current) {
          previousQualityRef.current = quality;
          onQualityChangeRef.current?.(quality);
        }
      }

      if (enableLogging) {
        console.debug('📊 [NetworkQuality]', {
          quality,
          video: {
            packetsLost: `${String(newStats.videoPacketsLostPerSecond)}/s`,
            jitter: `${String(newStats.videoJitter)}ms`,
            bandwidth: `${String(newStats.videoBandwidth)}kbps`,
          },
          audio: {
            packetsLost: `${String(newStats.audioPacketsLostPerSecond)}/s`,
            jitter: `${String(newStats.audioJitter)}ms`,
            bandwidth: `${String(newStats.audioBandwidth)}kbps`,
          },
          rtt: `${String(newStats.roundTripTime)}ms`,
        });
      }

      // Warn on poor quality
      if (quality === 'poor' && enableLogging) {
        console.warn('⚠️ [NetworkQuality] Poor connection quality detected');
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ref can change between async operations
      if (isMountedRef.current && enableLogging) {
        console.error('❌ [NetworkQuality] Error analyzing stats:', error);
      }
    }
  }, [peerConnection, calculateQuality, enableLogging]);

  // ========================================================================
  // Effect: Start/Stop Monitoring
  // ========================================================================

  useEffect(() => {
    isMountedRef.current = true;

    if (!peerConnection) {
      const resetTimer = setTimeout(() => {
        setStats(initialStats);
      }, 0);
      return () => {
        clearTimeout(resetTimer);
      };
    }

    console.debug('📊 [NetworkQuality] Starting monitoring');

    const initialTimer = setTimeout(() => {
      void analyzeStats();
    }, 0);

    const intervalId = setInterval(() => {
      void analyzeStats();
    }, interval);

    return () => {
      console.debug('📊 [NetworkQuality] Stopping monitoring');
      isMountedRef.current = false;
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      previousStatsRef.current = null;
    };
  }, [peerConnection, interval, analyzeStats]);

  // ========================================================================
  // Effect: Reset on PeerConnection Change
  // ========================================================================

  useEffect(() => {
    previousStatsRef.current = null;
    previousQualityRef.current = 'unknown';
  }, [peerConnection]);

  return stats;
};

export default useNetworkQuality;
