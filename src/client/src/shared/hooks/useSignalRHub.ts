/**
 * Type-Safe SignalR Hub Hook for Video Calls - ENHANCED VERSION
 *
 * Features:
 * - Fully typed event handlers with compile-time safety
 * - Automatic reconnection with exponential backoff
 * - Connection quality monitoring and latency tracking
 * - Message queue for offline support
 * - Retry logic for failed invokes
 * - Debug mode with detailed logging
 * - Connection health monitoring
 * - Event emitter pattern for decoupled event handling
 */

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
  type HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import {
  type ClientToServerMethods,
  type SignalRConnectionInfo,
  DEFAULT_RECONNECT_STRATEGY,
  getNextRetryDelay,
  type UserJoinedPayload,
  type UserLeftPayload,
  type RoomJoinedPayload,
  type MediaStateChangedPayload,
  type ChatMessagePayload,
  type HeartbeatAckPayload,
  type CallEndedPayload,
} from '../types/signalr/VideoCallHubTypes';
import { getToken } from '../utils/authHelpers';
import { VideoCallError, fromSignalRError } from '../utils/errors/VideoCallError';

// ============================================================================
// Types
// ============================================================================

export interface SignalREventHandlers {
  // Room Management
  onUserJoined?: (data: UserJoinedPayload) => void;
  onUserLeft?: (data: UserLeftPayload) => void;
  onRoomJoined?: (data: RoomJoinedPayload) => void;
  onCallEnded?: (data: CallEndedPayload) => void;

  // WebRTC Signaling
  onReceiveOffer?: (fromUserId: string, offer: string) => void;
  onReceiveAnswer?: (fromUserId: string, answer: string) => void;
  onReceiveIceCandidate?: (fromUserId: string, candidate: string) => void;

  // E2EE Key Exchange
  onReceiveKeyOffer?: (fromUserId: string, message: string) => void;
  onReceiveKeyAnswer?: (fromUserId: string, message: string) => void;
  onReceiveKeyRotation?: (fromUserId: string, message: string) => void;

  // Media State
  onMediaStateChanged?: (data: MediaStateChangedPayload) => void;

  // Chat
  onChatMessage?: (data: ChatMessagePayload) => void;

  // Connection Lifecycle
  onHeartbeatAck?: (data: HeartbeatAckPayload) => void;
  onConnected?: () => void;
  onDisconnected?: (error?: Error) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
  onError?: (error: VideoCallError) => void;

  // Connection Quality
  onLatencyUpdate?: (latencyMs: number) => void;
  onConnectionQualityChange?: (quality: ConnectionQuality) => void;
}

// ============================================================================
// Connection Quality Types
// ============================================================================

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

export interface ConnectionMetrics {
  latencyMs: number;
  latencyHistory: number[];
  averageLatencyMs: number;
  jitterMs: number;
  packetsLost: number;
  quality: ConnectionQuality;
  lastMeasured: Date | null;
}

export interface InvokeMetrics {
  totalInvokes: number;
  successfulInvokes: number;
  failedInvokes: number;
  retriedInvokes: number;
  averageResponseTimeMs: number;
}

// ============================================================================
// Message Queue Types (Offline Support)
// ============================================================================

interface QueuedMessage {
  id: string;
  method: keyof ClientToServerMethods;
  args: unknown[];
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseSignalRHubOptions {
  hubUrl?: string;
  heartbeatInterval?: number;
  latencyCheckInterval?: number;
  autoConnect?: boolean;
  logLevel?: LogLevel;
  debug?: boolean;
  enableOfflineQueue?: boolean;
  maxQueueSize?: number;
  invokeTimeout?: number;
  maxInvokeRetries?: number;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseSignalRHubReturn {
  // Connection State
  connectionInfo: SignalRConnectionInfo;
  isConnected: boolean;
  isConnecting: boolean;
  isOnline: boolean;

  // Connection Metrics
  metrics: ConnectionMetrics;
  invokeMetrics: InvokeMetrics;

  // Message Queue
  queuedMessages: number;

  // Connection Management
  connect: (roomId: string, handlers: SignalREventHandlers) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;

  // Typed Methods (Client -> Server)
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  sendOffer: (roomId: string, targetUserId: string, sdp: string) => Promise<void>;
  sendAnswer: (roomId: string, targetUserId: string, sdp: string) => Promise<void>;
  sendIceCandidate: (roomId: string, targetUserId: string, candidate: string) => Promise<void>;
  sendKeyOffer: (roomId: string, targetUserId: string, keyData: string) => Promise<void>;
  sendKeyAnswer: (roomId: string, targetUserId: string, keyData: string) => Promise<void>;
  sendKeyRotation: (roomId: string, targetUserId: string, keyData: string) => Promise<void>;
  sendChatMessage: (roomId: string, message: string) => Promise<void>;
  mediaStateChanged: (roomId: string, mediaType: string, enabled: boolean) => Promise<void>;
  sendHeartbeat: (roomId: string) => Promise<void>;

  // Queue Management
  flushQueue: () => Promise<void>;
  clearQueue: () => void;

  // Debug
  getDebugInfo: () => DebugInfo;

  // Raw connection access
  connection: HubConnection | null;
}

export interface DebugInfo {
  connectionState: string;
  connectionId: string | null;
  roomId: string | null;
  isOnline: boolean;
  metrics: ConnectionMetrics;
  invokeMetrics: InvokeMetrics;
  queuedMessages: QueuedMessage[];
  eventHandlersRegistered: string[];
  lastError: VideoCallError | null;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_HUB_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/videocall/hub`;
const DEFAULT_HEARTBEAT_INTERVAL = 30000;
const DEFAULT_LATENCY_CHECK_INTERVAL = 10000;
const DEFAULT_INVOKE_TIMEOUT = 10000;
const DEFAULT_MAX_INVOKE_RETRIES = 3;
const DEFAULT_MAX_QUEUE_SIZE = 100;
const LATENCY_HISTORY_SIZE = 10;

// Latency thresholds for quality assessment
const LATENCY_THRESHOLDS = {
  excellent: 50, // < 50ms
  good: 100, // < 100ms
  fair: 200, // < 200ms
  poor: 500, // < 500ms
  // >= 500ms = disconnected quality
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function calculateJitter(latencyHistory: number[]): number {
  if (latencyHistory.length < 2) return 0;

  let totalVariation = 0;
  for (let i = 1; i < latencyHistory.length; i++) {
    totalVariation += Math.abs(latencyHistory[i] - latencyHistory[i - 1]);
  }
  return totalVariation / (latencyHistory.length - 1);
}

function assessConnectionQuality(latencyMs: number, jitterMs: number): ConnectionQuality {
  if (latencyMs < 0) return 'disconnected';
  if (latencyMs <= LATENCY_THRESHOLDS.excellent && jitterMs < 20) return 'excellent';
  if (latencyMs <= LATENCY_THRESHOLDS.good && jitterMs < 40) return 'good';
  if (latencyMs <= LATENCY_THRESHOLDS.fair && jitterMs < 80) return 'fair';
  if (latencyMs <= LATENCY_THRESHOLDS.poor) return 'poor';
  return 'disconnected';
}

// ============================================================================
// Debug Logger
// ============================================================================

class SignalRDebugLogger {
  private enabled: boolean;
  private prefix = '[SignalR]';

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  log(...args: unknown[]): void {
    if (this.enabled) {
      console.debug(this.prefix, ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.enabled) {
      console.warn(this.prefix, ...args);
    }
  }

  error(...args: unknown[]): void {
    // Always log errors
    console.error(this.prefix, ...args);
  }

  group(label: string): void {
    if (this.enabled) {
      console.debug(`${this.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    // No-op for debug mode (group was converted to debug)
  }

  table(data: unknown): void {
    if (this.enabled) {
      console.debug(this.prefix, 'Table data:', data);
    }
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSignalRHub(options: UseSignalRHubOptions = {}): UseSignalRHubReturn {
  const {
    hubUrl = DEFAULT_HUB_URL,
    heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
    latencyCheckInterval = DEFAULT_LATENCY_CHECK_INTERVAL,
    logLevel = LogLevel.Warning,
    debug = false,
    enableOfflineQueue = true,
    maxQueueSize = DEFAULT_MAX_QUEUE_SIZE,
    invokeTimeout = DEFAULT_INVOKE_TIMEOUT,
    maxInvokeRetries = DEFAULT_MAX_INVOKE_RETRIES,
  } = options;

  // Logger
  const logger = useMemo(() => new SignalRDebugLogger(debug), [debug]);

  // Refs
  const connectionRef = useRef<HubConnection | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latencyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlersRef = useRef<SignalREventHandlers>({});
  const roomIdRef = useRef<string | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const lastErrorRef = useRef<VideoCallError | null>(null);
  const flushQueueRef = useRef<() => Promise<void>>(async () => {});

  // Helper functions for atomic ref updates (avoids require-atomic-updates warnings)
  const setConnectionRef = useCallback((value: HubConnection | null) => {
    connectionRef.current = value;
  }, []);

  const setRoomIdRef = useCallback((value: string | null) => {
    roomIdRef.current = value;
  }, []);

  // State
  const [connectionInfo, setConnectionInfo] = useState<SignalRConnectionInfo>({
    state: 'Disconnected',
    connectionId: null,
    roomId: null,
    lastHeartbeat: null,
    reconnectAttempts: 0,
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    latencyMs: -1,
    latencyHistory: [],
    averageLatencyMs: 0,
    jitterMs: 0,
    packetsLost: 0,
    quality: 'disconnected',
    lastMeasured: null,
  });

  const [invokeMetrics, setInvokeMetrics] = useState<InvokeMetrics>({
    totalInvokes: 0,
    successfulInvokes: 0,
    failedInvokes: 0,
    retriedInvokes: 0,
    averageResponseTimeMs: 0,
  });

  const [queuedMessagesCount, setQueuedMessagesCount] = useState(0);

  // ===== Online/Offline Detection =====

  useEffect(() => {
    const handleOnline = (): void => {
      logger.log('Browser came online');
      setIsOnline(true);

      // Attempt to flush queue when coming back online
      if (connectionRef.current?.state === HubConnectionState.Connected) {
        void flushQueueRef.current();
      }
    };

    const handleOffline = (): void => {
      logger.warn('Browser went offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [logger]);

  // ===== Helper Functions =====

  const updateConnectionState = useCallback((updates: Partial<SignalRConnectionInfo>) => {
    setConnectionInfo((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateInvokeMetrics = useCallback(
    (success: boolean, responseTimeMs: number, wasRetry: boolean) => {
      setInvokeMetrics((prev) => {
        const newTotal = prev.totalInvokes + 1;
        const newSuccessful = success ? prev.successfulInvokes + 1 : prev.successfulInvokes;
        const newFailed = success ? prev.failedInvokes : prev.failedInvokes + 1;
        const newRetried = wasRetry ? prev.retriedInvokes + 1 : prev.retriedInvokes;

        // Calculate running average
        const newAvgResponseTime = success
          ? (prev.averageResponseTimeMs * prev.successfulInvokes + responseTimeMs) / newSuccessful
          : prev.averageResponseTimeMs;

        return {
          totalInvokes: newTotal,
          successfulInvokes: newSuccessful,
          failedInvokes: newFailed,
          retriedInvokes: newRetried,
          averageResponseTimeMs: newAvgResponseTime,
        };
      });
    },
    []
  );

  const updateLatencyMetrics = useCallback((latencyMs: number) => {
    setMetrics((prev) => {
      const newHistory = [...prev.latencyHistory, latencyMs].slice(-LATENCY_HISTORY_SIZE);
      const avgLatency = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
      const jitter = calculateJitter(newHistory);
      const quality = assessConnectionQuality(avgLatency, jitter);

      const newMetrics: ConnectionMetrics = {
        latencyMs,
        latencyHistory: newHistory,
        averageLatencyMs: avgLatency,
        jitterMs: jitter,
        packetsLost: prev.packetsLost,
        quality,
        lastMeasured: new Date(),
      };

      // Notify handler if quality changed
      if (prev.quality !== quality) {
        handlersRef.current.onConnectionQualityChange?.(quality);
      }

      // Notify handler of latency update
      handlersRef.current.onLatencyUpdate?.(latencyMs);

      return newMetrics;
    });
  }, []);

  // ===== Message Queue Management =====

  const addToQueue = useCallback(
    (
      method: keyof ClientToServerMethods,
      args: unknown[],
      priority: 'high' | 'normal' | 'low'
    ): string => {
      if (!enableOfflineQueue) {
        throw new VideoCallError('SIGNALR_DISCONNECTED', {}, 'Offline queue is disabled');
      }

      if (messageQueueRef.current.length >= maxQueueSize) {
        // Remove oldest low-priority message
        const lowPriorityIndex = messageQueueRef.current.findIndex((m) => m.priority === 'low');
        if (lowPriorityIndex === -1) {
          // Remove oldest message
          messageQueueRef.current.shift();
        } else {
          messageQueueRef.current.splice(lowPriorityIndex, 1);
        }
        logger.warn('Queue full, removed oldest message');
      }

      const message: QueuedMessage = {
        id: generateMessageId(),
        method,
        args,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: maxInvokeRetries,
        priority,
      };

      // Insert based on priority
      if (priority === 'high') {
        const firstNonHighIndex = messageQueueRef.current.findIndex((m) => m.priority !== 'high');
        if (firstNonHighIndex === -1) {
          messageQueueRef.current.push(message);
        } else {
          messageQueueRef.current.splice(firstNonHighIndex, 0, message);
        }
      } else {
        messageQueueRef.current.push(message);
      }

      setQueuedMessagesCount(messageQueueRef.current.length);
      logger.log(
        `Message queued: ${method} (${message.id}), queue size: ${messageQueueRef.current.length}`
      );

      return message.id;
    },
    [enableOfflineQueue, maxQueueSize, maxInvokeRetries, logger]
  );

  const removeFromQueue = useCallback((messageId: string) => {
    const index = messageQueueRef.current.findIndex((m) => m.id === messageId);
    if (index !== -1) {
      messageQueueRef.current.splice(index, 1);
      setQueuedMessagesCount(messageQueueRef.current.length);
    }
  }, []);

  const flushQueue = useCallback(async (): Promise<void> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      logger.warn('Cannot flush queue: not connected');
      return;
    }

    if (messageQueueRef.current.length === 0) {
      return;
    }

    logger.group(`Flushing message queue (${messageQueueRef.current.length} messages)`);

    const messagesToProcess = [...messageQueueRef.current];

    for (const message of messagesToProcess) {
      try {
        logger.log(`Processing queued message: ${message.method} (${message.id})`);
        // eslint-disable-next-line no-await-in-loop -- Intentional: messages must be processed sequentially
        await connection.invoke(message.method, ...message.args);
        removeFromQueue(message.id);
        logger.log(`Successfully sent queued message: ${message.id}`);
      } catch (error) {
        message.retryCount++;

        if (message.retryCount >= message.maxRetries) {
          logger.error(
            `Failed to send queued message after ${message.maxRetries} retries: ${message.id}`,
            error
          );
          removeFromQueue(message.id);
        } else {
          logger.warn(
            `Queued message failed, will retry (${message.retryCount}/${message.maxRetries}): ${message.id}`
          );
        }
      }
    }

    logger.groupEnd();
  }, [logger, removeFromQueue]);

  // Sync flushQueue to ref for use in online/offline handler
  useEffect(() => {
    flushQueueRef.current = flushQueue;
  }, [flushQueue]);

  const clearQueue = useCallback(() => {
    messageQueueRef.current = [];
    setQueuedMessagesCount(0);
    logger.log('Message queue cleared');
  }, [logger]);

  // ===== Latency Check =====

  const measureLatency = useCallback(async (): Promise<number> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return -1;
    }

    const startTime = performance.now();

    try {
      // Use heartbeat as ping mechanism
      await connection.invoke('SendHeartbeat', roomIdRef.current ?? '');
      const latency = Math.round(performance.now() - startTime);
      updateLatencyMetrics(latency);
      return latency;
    } catch (error) {
      logger.warn('Latency measurement failed:', error);
      return -1;
    }
  }, [updateLatencyMetrics, logger]);

  // ===== Invoke with Retry =====

  const invokeWithRetry = useCallback(
    async <T extends keyof ClientToServerMethods>(
      method: T,
      args: Parameters<ClientToServerMethods[T]>,
      invokeOptions: {
        priority?: 'high' | 'normal' | 'low';
        retries?: number;
        queueIfOffline?: boolean;
      }
    ): Promise<void> => {
      const {
        priority = 'normal',
        retries = maxInvokeRetries,
        queueIfOffline = enableOfflineQueue,
      } = invokeOptions;

      const connection = connectionRef.current;

      // If not connected and queueing is enabled, add to queue
      if (!connection || connection.state !== HubConnectionState.Connected) {
        if (queueIfOffline) {
          addToQueue(method, args as unknown[], priority);
          return;
        }
        throw new VideoCallError('SIGNALR_DISCONNECTED', {
          roomId: roomIdRef.current ?? undefined,
        });
      }

      let lastError: Error | null = null;
      const startTime = performance.now();

      for (let attempt = 0; attempt <= retries; attempt++) {
        const isRetry = attempt > 0;

        try {
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Invoke timeout'));
            }, invokeTimeout);
          });

          // Race between invoke and timeout
          // eslint-disable-next-line no-await-in-loop -- Intentional: retry loop requires sequential execution
          await Promise.race([connection.invoke(method, ...args), timeoutPromise]);

          const responseTime = performance.now() - startTime;
          updateInvokeMetrics(true, responseTime, isRetry);

          if (isRetry) {
            logger.log(`${method} succeeded on retry ${attempt}`);
          }

          return;
        } catch (error) {
          lastError = error as Error;

          if (attempt < retries) {
            const delay = getNextRetryDelay(attempt, {
              ...DEFAULT_RECONNECT_STRATEGY,
              initialDelayMs: 500,
              maxDelayMs: 5000,
            });

            logger.warn(
              `${method} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`
            );
            // eslint-disable-next-line no-await-in-loop -- Intentional: delay before next retry
            await new Promise<void>((resolve) => {
              setTimeout(resolve, delay);
            });
          }
        }
      }

      // All retries failed
      const responseTime = performance.now() - startTime;
      updateInvokeMetrics(false, responseTime, retries > 0);

      const videoCallError = fromSignalRError(lastError, {
        roomId: roomIdRef.current ?? undefined,
      });
      lastErrorRef.current = videoCallError;

      // Queue if enabled and appropriate error type
      if (queueIfOffline && lastError?.message.includes('timeout')) {
        addToQueue(method, args as unknown[], priority);
        logger.log(`${method} queued after timeout`);
        return;
      }

      throw videoCallError;
    },
    [maxInvokeRetries, enableOfflineQueue, invokeTimeout, updateInvokeMetrics, addToQueue, logger]
  );

  // ===== Safe Invoke (Simplified wrapper) =====

  const safeInvoke = useCallback(
    async <T extends keyof ClientToServerMethods>(
      method: T,
      ...args: Parameters<ClientToServerMethods[T]>
    ): Promise<void> => invokeWithRetry(method, args, {}),
    [invokeWithRetry]
  );

  // ===== Event Registration =====

  const registerEventHandlers = useCallback(
    (connection: HubConnection, handlers: SignalREventHandlers) => {
      handlersRef.current = handlers;

      logger.group('Registering SignalR event handlers');

      // Room Management
      connection.on('UserJoined', (data: UserJoinedPayload) => {
        logger.log('UserJoined:', data);
        handlers.onUserJoined?.(data);
      });

      connection.on('UserLeft', (data: UserLeftPayload) => {
        logger.log('UserLeft:', data);
        handlers.onUserLeft?.(data);
      });

      connection.on('RoomJoined', (data: RoomJoinedPayload) => {
        logger.log('RoomJoined:', data);
        handlers.onRoomJoined?.(data);
      });

      connection.on('CallEnded', (data: CallEndedPayload) => {
        logger.log('CallEnded:', data);
        handlers.onCallEnded?.(data);
      });

      // WebRTC Signaling
      connection.on('ReceiveOffer', (data: { fromUserId: string; offer: string }) => {
        logger.log('ReceiveOffer from:', data.fromUserId);
        handlers.onReceiveOffer?.(data.fromUserId, data.offer);
      });

      connection.on('ReceiveAnswer', (data: { fromUserId: string; answer: string }) => {
        logger.log('ReceiveAnswer from:', data.fromUserId);
        handlers.onReceiveAnswer?.(data.fromUserId, data.answer);
      });

      connection.on('ReceiveIceCandidate', (data: { fromUserId: string; candidate: string }) => {
        logger.log('ReceiveIceCandidate from:', data.fromUserId);
        handlers.onReceiveIceCandidate?.(data.fromUserId, data.candidate);
      });

      // E2EE Key Exchange
      connection.on('ReceiveKeyOffer', (fromUserId: string, message: string) => {
        logger.log('ReceiveKeyOffer from:', fromUserId);
        handlers.onReceiveKeyOffer?.(fromUserId, message);
      });

      connection.on('ReceiveKeyAnswer', (fromUserId: string, message: string) => {
        logger.log('ReceiveKeyAnswer from:', fromUserId);
        handlers.onReceiveKeyAnswer?.(fromUserId, message);
      });

      connection.on('ReceiveKeyRotation', (fromUserId: string, message: string) => {
        logger.log('ReceiveKeyRotation from:', fromUserId);
        handlers.onReceiveKeyRotation?.(fromUserId, message);
      });

      // Media State
      connection.on('MediaStateChanged', (data: MediaStateChangedPayload) => {
        logger.log('MediaStateChanged:', data);
        handlers.onMediaStateChanged?.(data);
      });

      // Chat
      connection.on('ChatMessage', (data: ChatMessagePayload) => {
        logger.log('ChatMessage from:', data.userId);
        handlers.onChatMessage?.(data);
      });

      // Heartbeat
      connection.on('HeartbeatAck', (data: HeartbeatAckPayload) => {
        updateConnectionState({ lastHeartbeat: new Date() });
        handlers.onHeartbeatAck?.(data);
      });

      logger.groupEnd();
    },
    [updateConnectionState, logger]
  );

  // ===== Start Monitoring Intervals =====

  const startHeartbeat = useCallback(
    (roomId: string) => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = setInterval(() => {
        const connection = connectionRef.current;
        if (connection?.state === HubConnectionState.Connected) {
          void connection.invoke('SendHeartbeat', roomId).catch((error: unknown) => {
            logger.warn('Heartbeat failed:', error);
          });
        }
      }, heartbeatInterval);

      logger.log(`Heartbeat started (interval: ${heartbeatInterval}ms)`);
    },
    [heartbeatInterval, logger]
  );

  const startLatencyMonitoring = useCallback(() => {
    if (latencyIntervalRef.current) {
      clearInterval(latencyIntervalRef.current);
    }

    latencyIntervalRef.current = setInterval(() => {
      void measureLatency();
    }, latencyCheckInterval);

    // Measure immediately
    void measureLatency();

    logger.log(`Latency monitoring started (interval: ${latencyCheckInterval}ms)`);
  }, [latencyCheckInterval, measureLatency, logger]);

  const stopMonitoring = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (latencyIntervalRef.current) {
      clearInterval(latencyIntervalRef.current);
      latencyIntervalRef.current = null;
    }

    logger.log('Monitoring stopped');
  }, [logger]);

  // ===== Connection Management =====

  const connect = useCallback(
    async (roomId: string, handlers: SignalREventHandlers): Promise<void> => {
      // Prevent double connection
      if (connectionRef.current?.state === HubConnectionState.Connected) {
        logger.warn('Already connected');
        return;
      }

      const token = getToken();
      if (!token) {
        const error = new VideoCallError('UNAUTHORIZED', {});
        lastErrorRef.current = error;
        handlers.onError?.(error);
        throw error;
      }

      logger.group(`Connecting to SignalR hub (room: ${roomId})`);
      updateConnectionState({ state: 'Connecting', roomId });

      try {
        const connection = new HubConnectionBuilder()
          .withUrl(`${hubUrl}?roomId=${roomId}`, {
            accessTokenFactory: () => token,
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              updateConnectionState({
                state: 'Reconnecting',
                reconnectAttempts: retryContext.previousRetryCount,
              });

              if (retryContext.previousRetryCount >= DEFAULT_RECONNECT_STRATEGY.maxRetries) {
                return null; // Stop reconnecting
              }

              const delay = getNextRetryDelay(retryContext.previousRetryCount);
              logger.log(
                `Reconnect attempt ${retryContext.previousRetryCount + 1}, delay: ${delay}ms`
              );
              return delay;
            },
          })
          .configureLogging(logLevel)
          .build();

        // Connection lifecycle events
        connection.onclose((error) => {
          logger.warn('Connection closed', error);
          updateConnectionState({
            state: 'Disconnected',
            connectionId: null,
          });
          stopMonitoring();

          setMetrics((prev) => ({ ...prev, quality: 'disconnected', latencyMs: -1 }));
          handlers.onDisconnected?.(error ?? undefined);
        });

        connection.onreconnecting((error) => {
          logger.log('Reconnecting...', error);
          updateConnectionState({ state: 'Reconnecting' });
          setMetrics((prev) => ({ ...prev, quality: 'disconnected' }));
          handlers.onReconnecting?.(error ?? undefined);
        });

        connection.onreconnected((connectionId) => {
          logger.log('Reconnected:', connectionId);
          updateConnectionState({
            state: 'Connected',
            connectionId: connectionId ?? null,
            reconnectAttempts: 0,
          });

          // Rejoin room after reconnect
          if (roomIdRef.current) {
            connection.invoke('JoinRoom', roomIdRef.current).catch((e: unknown) => {
              logger.warn('Failed to rejoin room after reconnect:', e);
            });
          }

          // Flush any queued messages
          void flushQueue();

          // Restart latency monitoring
          startLatencyMonitoring();

          handlers.onReconnected?.(connectionId);
        });

        // Register event handlers
        registerEventHandlers(connection, handlers);

        // Start connection
        await connection.start();

        setConnectionRef(connection);
        setRoomIdRef(roomId);

        updateConnectionState({
          state: 'Connected',
          connectionId: connection.connectionId ?? null,
          reconnectAttempts: 0,
        });

        // Join room
        await connection.invoke('JoinRoom', roomId);
        logger.log('Joined room:', roomId);

        // Start monitoring
        startHeartbeat(roomId);
        startLatencyMonitoring();

        // Flush any queued messages from before connection
        await flushQueue();

        handlers.onConnected?.();

        logger.log('Connection successful');
        logger.groupEnd();
      } catch (error) {
        logger.error('Connection failed:', error);
        logger.groupEnd();

        updateConnectionState({
          state: 'Disconnected',
          connectionId: null,
        });

        const videoCallError = fromSignalRError(error, { roomId });
        lastErrorRef.current = videoCallError;
        handlers.onError?.(videoCallError);
        throw videoCallError;
      }
    },
    [
      hubUrl,
      logLevel,
      registerEventHandlers,
      startHeartbeat,
      startLatencyMonitoring,
      stopMonitoring,
      flushQueue,
      updateConnectionState,
      setConnectionRef,
      setRoomIdRef,
      logger,
    ]
  );

  const disconnect = useCallback(async (): Promise<void> => {
    logger.log('Disconnecting...');
    stopMonitoring();

    const connection = connectionRef.current;
    if (connection) {
      try {
        if (roomIdRef.current) {
          await connection.invoke('LeaveRoom', roomIdRef.current).catch(() => {});
        }
        await connection.stop();
      } catch (error) {
        logger.warn('Disconnect error:', error);
      } finally {
        setConnectionRef(null);
        setRoomIdRef(null);
        updateConnectionState({
          state: 'Disconnected',
          connectionId: null,
          roomId: null,
        });
        setMetrics((prev) => ({ ...prev, quality: 'disconnected', latencyMs: -1 }));
      }
    }

    logger.log('Disconnected');
  }, [stopMonitoring, updateConnectionState, setConnectionRef, setRoomIdRef, logger]);

  const reconnect = useCallback(async (): Promise<void> => {
    const handlers = handlersRef.current;
    const roomId = roomIdRef.current;

    if (!roomId) {
      logger.error('Cannot reconnect: no room ID');
      return;
    }

    await disconnect();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000); // Brief delay
    });
    await connect(roomId, handlers);
  }, [connect, disconnect, logger]);

  // ===== Typed Invoke Methods =====

  const joinRoom = useCallback((roomId: string) => safeInvoke('JoinRoom', roomId), [safeInvoke]);

  const leaveRoom = useCallback((roomId: string) => safeInvoke('LeaveRoom', roomId), [safeInvoke]);

  const sendOffer = useCallback(
    (roomId: string, targetUserId: string, sdp: string) =>
      invokeWithRetry('SendOffer', [roomId, targetUserId, sdp], { priority: 'high' }),
    [invokeWithRetry]
  );

  const sendAnswer = useCallback(
    (roomId: string, targetUserId: string, sdp: string) =>
      invokeWithRetry('SendAnswer', [roomId, targetUserId, sdp], { priority: 'high' }),
    [invokeWithRetry]
  );

  const sendIceCandidate = useCallback(
    (roomId: string, targetUserId: string, candidate: string) =>
      invokeWithRetry('SendIceCandidate', [roomId, targetUserId, candidate], { priority: 'high' }),
    [invokeWithRetry]
  );

  const sendKeyOffer = useCallback(
    (roomId: string, targetUserId: string, keyData: string) =>
      invokeWithRetry('SendKeyOffer', [roomId, targetUserId, keyData], { priority: 'high' }),
    [invokeWithRetry]
  );

  const sendKeyAnswer = useCallback(
    (roomId: string, targetUserId: string, keyData: string) =>
      invokeWithRetry('SendKeyAnswer', [roomId, targetUserId, keyData], { priority: 'high' }),
    [invokeWithRetry]
  );

  const sendKeyRotation = useCallback(
    (roomId: string, targetUserId: string, keyData: string) =>
      invokeWithRetry('SendKeyRotation', [roomId, targetUserId, keyData], { priority: 'normal' }),
    [invokeWithRetry]
  );

  const sendChatMessage = useCallback(
    (roomId: string, message: string) =>
      invokeWithRetry('SendChatMessage', [roomId, message], {
        priority: 'normal',
        queueIfOffline: true,
      }),
    [invokeWithRetry]
  );

  const mediaStateChanged = useCallback(
    (roomId: string, mediaType: string, enabled: boolean) =>
      invokeWithRetry('MediaStateChanged', [roomId, mediaType, enabled], { priority: 'normal' }),
    [invokeWithRetry]
  );

  const sendHeartbeat = useCallback(
    (roomId: string) => safeInvoke('SendHeartbeat', roomId),
    [safeInvoke]
  );

  // ===== Debug Info =====

  const getDebugInfo = useCallback(
    (): DebugInfo => ({
      connectionState: connectionRef.current?.state.toString() ?? 'null',
      connectionId: connectionInfo.connectionId,
      roomId: roomIdRef.current,
      isOnline,
      metrics,
      invokeMetrics,
      queuedMessages: [...messageQueueRef.current],
      eventHandlersRegistered: Object.keys(handlersRef.current).filter(
        (k) => handlersRef.current[k as keyof SignalREventHandlers] !== undefined
      ),
      lastError: lastErrorRef.current,
    }),
    [connectionInfo.connectionId, isOnline, metrics, invokeMetrics]
  );

  // ===== Cleanup =====

  useEffect(
    () => () => {
      stopMonitoring();
      connectionRef.current?.stop().catch(() => {});
    },
    [stopMonitoring]
  );

  // ===== Return =====

  return {
    // Connection State
    connectionInfo,
    isConnected: connectionInfo.state === 'Connected',
    isConnecting: connectionInfo.state === 'Connecting' || connectionInfo.state === 'Reconnecting',
    isOnline,

    // Metrics
    metrics,
    invokeMetrics,

    // Queue
    queuedMessages: queuedMessagesCount,

    // Connection Management
    connect,
    disconnect,
    reconnect,

    // Typed Methods
    joinRoom,
    leaveRoom,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendKeyOffer,
    sendKeyAnswer,
    sendKeyRotation,
    sendChatMessage,
    mediaStateChanged,
    sendHeartbeat,

    // Queue Management
    flushQueue,
    clearQueue,

    // Debug
    getDebugInfo,

    // Raw connection
    connection: connectionRef.current,
  };
}

export default useSignalRHub;
