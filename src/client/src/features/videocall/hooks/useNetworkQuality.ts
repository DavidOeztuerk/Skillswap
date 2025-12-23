import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface NetworkQualityStats {
  quality: NetworkQuality;
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
// Scoring Thresholds
// ============================================================================

interface ThresholdConfig {
  high: { value: number; penalty: number };
  medium: { value: number; penalty: number };
  low: { value: number; penalty: number };
}

const SCORING_THRESHOLDS: Record<string, ThresholdConfig> = {
  audioPacketLoss: {
    high: { value: 3, penalty: 40 },
    medium: { value: 1, penalty: 20 },
    low: { value: 0, penalty: 5 },
  },
  videoPacketLoss: {
    high: { value: 5, penalty: 30 },
    medium: { value: 2, penalty: 15 },
    low: { value: 0, penalty: 5 },
  },
  audioJitter: {
    high: { value: 50, penalty: 25 },
    medium: { value: 30, penalty: 15 },
    low: { value: 15, penalty: 5 },
  },
  videoJitter: {
    high: { value: 100, penalty: 15 },
    medium: { value: 50, penalty: 10 },
    low: { value: 30, penalty: 5 },
  },
  rtt: {
    high: { value: 400, penalty: 25 },
    medium: { value: 200, penalty: 15 },
    low: { value: 100, penalty: 5 },
  },
};

const applyThresholdPenalty = (value: number, threshold: ThresholdConfig): number => {
  if (value > threshold.high.value) return threshold.high.penalty;
  if (value > threshold.medium.value) return threshold.medium.penalty;
  if (value > threshold.low.value) return threshold.low.penalty;
  return 0;
};

const getQualityFromScore = (score: number): NetworkQuality => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};

// ============================================================================
// Stats Processing Helpers
// ============================================================================

interface RawStats {
  videoPacketsLost: number;
  videoJitter: number;
  videoBytesReceived: number;
  audioPacketsLost: number;
  audioJitter: number;
  audioBytesReceived: number;
  rtt: number;
  timestamp: number;
}

const processInboundRtpStats = (rtpStats: RTCInboundRtpStats, stats: RawStats): RawStats => {
  if (rtpStats.kind === 'video') {
    return {
      ...stats,
      videoPacketsLost: rtpStats.packetsLost ?? 0,
      videoJitter: (rtpStats.jitter ?? 0) * 1000,
      videoBytesReceived: rtpStats.bytesReceived ?? 0,
      timestamp: rtpStats.timestamp,
    };
  }
  // kind can only be 'video' | 'audio', so if not video, it's audio
  return {
    ...stats,
    audioPacketsLost: rtpStats.packetsLost ?? 0,
    audioJitter: (rtpStats.jitter ?? 0) * 1000,
    audioBytesReceived: rtpStats.bytesReceived ?? 0,
  };
};

const processCandidatePairStats = (pairStats: RTCCandidatePairStats, stats: RawStats): RawStats => {
  if (pairStats.state === 'succeeded' && pairStats.currentRoundTripTime !== undefined) {
    return { ...stats, rtt: pairStats.currentRoundTripTime * 1000 };
  }
  return stats;
};

const calculateDeltaStats = (
  current: RawStats,
  previous: PreviousStats | null
): { videoLossPerSec: number; audioLossPerSec: number; videoBw: number; audioBw: number } => {
  if (!previous) {
    return { videoLossPerSec: 0, audioLossPerSec: 0, videoBw: 0, audioBw: 0 };
  }

  const timeDiffSec = (current.timestamp - previous.timestamp) / 1000;
  if (timeDiffSec <= 0) {
    return { videoLossPerSec: 0, audioLossPerSec: 0, videoBw: 0, audioBw: 0 };
  }

  return {
    videoLossPerSec: Math.max(
      0,
      (current.videoPacketsLost - previous.videoPacketsLost) / timeDiffSec
    ),
    audioLossPerSec: Math.max(
      0,
      (current.audioPacketsLost - previous.audioPacketsLost) / timeDiffSec
    ),
    videoBw: ((current.videoBytesReceived - previous.videoBytesReceived) * 8) / timeDiffSec / 1000,
    audioBw: ((current.audioBytesReceived - previous.audioBytesReceived) * 8) / timeDiffSec / 1000,
  };
};

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

      score -= applyThresholdPenalty(audioPacketsLostPerSec, SCORING_THRESHOLDS.audioPacketLoss);
      score -= applyThresholdPenalty(videoPacketsLostPerSec, SCORING_THRESHOLDS.videoPacketLoss);
      score -= applyThresholdPenalty(audioJitter, SCORING_THRESHOLDS.audioJitter);
      score -= applyThresholdPenalty(videoJitter, SCORING_THRESHOLDS.videoJitter);
      score -= applyThresholdPenalty(rtt, SCORING_THRESHOLDS.rtt);

      return getQualityFromScore(score);
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

      // Process stats into raw values
      let rawStats: RawStats = {
        videoPacketsLost: 0,
        videoJitter: 0,
        videoBytesReceived: 0,
        audioPacketsLost: 0,
        audioJitter: 0,
        audioBytesReceived: 0,
        rtt: 0,
        timestamp: Date.now(),
      };

      statsReport.forEach((report: WebRTCStatsReport) => {
        if (report.type === 'inbound-rtp') {
          rawStats = processInboundRtpStats(report as RTCInboundRtpStats, rawStats);
        }
        if (report.type === 'candidate-pair') {
          rawStats = processCandidatePairStats(report as RTCCandidatePairStats, rawStats);
        }
      });

      // Calculate delta stats
      const delta = calculateDeltaStats(rawStats, previousStatsRef.current);

      // Store for next iteration
      previousStatsRef.current = {
        timestamp: rawStats.timestamp,
        videoPacketsLost: rawStats.videoPacketsLost,
        audioPacketsLost: rawStats.audioPacketsLost,
        videoBytesReceived: rawStats.videoBytesReceived,
        audioBytesReceived: rawStats.audioBytesReceived,
      };

      const quality = calculateQuality(
        delta.videoLossPerSec,
        delta.audioLossPerSec,
        rawStats.videoJitter,
        rawStats.audioJitter,
        rawStats.rtt
      );

      const newStats: NetworkQualityStats = {
        quality,
        videoPacketsLost: rawStats.videoPacketsLost,
        videoPacketsLostPerSecond: Math.round(delta.videoLossPerSec * 10) / 10,
        videoJitter: Math.round(rawStats.videoJitter),
        videoBandwidth: Math.round(delta.videoBw),
        audioPacketsLost: rawStats.audioPacketsLost,
        audioPacketsLostPerSecond: Math.round(delta.audioLossPerSec * 10) / 10,
        audioJitter: Math.round(rawStats.audioJitter),
        audioBandwidth: Math.round(delta.audioBw),
        roundTripTime: Math.round(rawStats.rtt),
        totalBandwidth: Math.round(delta.videoBw + delta.audioBw),
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
            packetsLost: `${newStats.videoPacketsLostPerSecond}/s`,
            jitter: `${newStats.videoJitter}ms`,
            bandwidth: `${newStats.videoBandwidth}kbps`,
          },
          audio: {
            packetsLost: `${newStats.audioPacketsLostPerSecond}/s`,
            jitter: `${newStats.audioJitter}ms`,
            bandwidth: `${newStats.audioBandwidth}kbps`,
          },
          rtt: `${newStats.roundTripTime}ms`,
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
