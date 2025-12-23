/**
 * useSignalRHub Hook
 *
 * Manages SignalR connection lifecycle with:
 * - Automatic reconnection
 * - Connection state tracking
 * - Typed event handlers
 * - E2EE message integration
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { getToken } from '../../../shared/utils/authHelpers';
import { E2EEHubEvents, sendE2EEMessage } from '../types/e2eeHubTypes';
import { WebRTCError, WebRTCErrorCode } from '../types/webRtcError';
import type {
  E2EEInboundMessage,
  E2EEOutboundMessage,
  E2EEOperationResult,
} from '../types/e2eeHubTypes';
import type { HubConnection } from '@microsoft/signalr';

// ============================================================================
// Types
// ============================================================================

export type SignalRConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface UseSignalRHubOptions {
  roomId: string;
  onE2EEMessage?: (message: E2EEInboundMessage) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onOffer?: (fromUserId: string, offer: string) => void;
  onAnswer?: (fromUserId: string, answer: string) => void;
  onIceCandidate?: (fromUserId: string, candidate: string) => void;
  onError?: (error: WebRTCError) => void;
  autoConnect?: boolean;
}

export interface UseSignalRHubReturn {
  connection: HubConnection | null;
  connectionState: SignalRConnectionState;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendE2EEMessage: (message: E2EEOutboundMessage) => Promise<E2EEOperationResult>;
  sendOffer: (targetUserId: string, sdp: string) => Promise<void>;
  sendAnswer: (targetUserId: string, sdp: string) => Promise<void>;
  sendIceCandidate: (targetUserId: string, candidate: string) => Promise<void>;
  joinRoom: () => Promise<void>;
  error: WebRTCError | null;
}

// ============================================================================
// Constants
// ============================================================================

const HUB_URL = '/hubs/videocall';
const RECONNECT_DELAYS = [0, 2000, 5000, 10000, 30000]; // Exponential backoff
const NOT_CONNECTED_ERROR = 'Not connected';

// ============================================================================
// Hook
// ============================================================================

export function useSignalRHub(options: UseSignalRHubOptions): UseSignalRHubReturn {
  const {
    roomId,
    onE2EEMessage,
    onUserJoined,
    onUserLeft,
    onOffer,
    onAnswer,
    onIceCandidate,
    onError,
    autoConnect = true,
  } = options;

  const [connectionState, setConnectionState] = useState<SignalRConnectionState>('disconnected');
  const [error, setError] = useState<WebRTCError | null>(null);

  const connectionRef = useRef<HubConnection | null>(null);
  const isMountedRef = useRef(true);
  const reconnectAttemptRef = useRef(0);

  // ============================================================================
  // Build Connection
  // ============================================================================

  const buildConnection = useCallback((): HubConnection => {
    const token = getToken();

    return new HubConnectionBuilder()
      .withUrl(`${HUB_URL}?roomId=${encodeURIComponent(roomId)}`, {
        accessTokenFactory: () => token ?? '',
      })
      .withAutomaticReconnect(RECONNECT_DELAYS)
      .configureLogging(process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Warning)
      .build();
  }, [roomId]);

  // ============================================================================
  // Setup Event Handlers
  // ============================================================================

  const setupEventHandlers = useCallback(
    (connection: HubConnection) => {
      // Connection state events
      connection.onreconnecting(() => {
        if (isMountedRef.current) {
          setConnectionState('reconnecting');
          reconnectAttemptRef.current++;
        }
      });

      connection.onreconnected(() => {
        if (isMountedRef.current) {
          setConnectionState('connected');
          reconnectAttemptRef.current = 0;
          setError(null);
        }
      });

      connection.onclose((err) => {
        if (isMountedRef.current) {
          setConnectionState('disconnected');
          if (err) {
            const errorMessage = err.message || 'Connection closed';
            const webrtcError = new WebRTCError(
              WebRTCErrorCode.SIGNALING_DISCONNECTED,
              errorMessage,
              { cause: err instanceof Error ? err : undefined }
            );
            setError(webrtcError);
            onError?.(webrtcError);
          }
        }
      });

      // E2EE events (new unified)
      if (onE2EEMessage) {
        connection.on(E2EEHubEvents.ReceiveE2EEMessage, onE2EEMessage);
      }

      // Legacy E2EE events (for backward compatibility)
      connection.on(
        E2EEHubEvents.ReceiveKeyOffer,
        (fromUserId: string, keyExchangeData: string) => {
          onE2EEMessage?.({
            fromUserId,
            type: 'KeyOffer',
            payload: keyExchangeData,
            timestamp: new Date().toISOString(),
          });
        }
      );

      connection.on(
        E2EEHubEvents.ReceiveKeyAnswer,
        (fromUserId: string, keyExchangeData: string) => {
          onE2EEMessage?.({
            fromUserId,
            type: 'KeyAnswer',
            payload: keyExchangeData,
            timestamp: new Date().toISOString(),
          });
        }
      );

      connection.on(
        E2EEHubEvents.ReceiveKeyRotation,
        (fromUserId: string, keyExchangeData: string) => {
          onE2EEMessage?.({
            fromUserId,
            type: 'KeyRotation',
            payload: keyExchangeData,
            timestamp: new Date().toISOString(),
          });
        }
      );

      // User events
      if (onUserJoined) {
        connection.on('UserJoined', (data: { userId: string }) => {
          onUserJoined(data.userId);
        });
      }

      if (onUserLeft) {
        connection.on('UserLeft', (data: { userId: string }) => {
          onUserLeft(data.userId);
        });
      }

      // WebRTC signaling events
      if (onOffer) {
        connection.on('ReceiveOffer', (data: { fromUserId: string; offer: string }) => {
          onOffer(data.fromUserId, data.offer);
        });
      }

      if (onAnswer) {
        connection.on('ReceiveAnswer', (data: { fromUserId: string; answer: string }) => {
          onAnswer(data.fromUserId, data.answer);
        });
      }

      if (onIceCandidate) {
        connection.on('ReceiveIceCandidate', (data: { fromUserId: string; candidate: string }) => {
          onIceCandidate(data.fromUserId, data.candidate);
        });
      }
    },
    [onE2EEMessage, onUserJoined, onUserLeft, onOffer, onAnswer, onIceCandidate, onError]
  );

  // ============================================================================
  // Connect
  // ============================================================================

  const connect = useCallback(async () => {
    if (connectionRef.current?.state === HubConnectionState.Connected) {
      return;
    }

    // Store mounted state before async operation
    if (!isMountedRef.current) return;

    setConnectionState('connecting');
    setError(null);

    const connection = buildConnection();
    setupEventHandlers(connection);

    try {
      await connection.start();
    } catch (err) {
      if (isMountedRef.current) {
        const webrtcError = new WebRTCError(
          WebRTCErrorCode.SIGNALING_FAILED,
          err instanceof Error ? err.message : 'Failed to connect',
          { cause: err instanceof Error ? err : undefined }
        );
        setConnectionState('error');
        setError(webrtcError);
        onError?.(webrtcError);
      }
      return;
    }

    // Post-connection handling - check mount state and update atomically
    if (!isMountedRef.current) {
      // Component unmounted during connection - clean up
      void connection.stop();
      return;
    }

    // Safe to assign - we've verified mount state synchronously
    // eslint-disable-next-line require-atomic-updates
    connectionRef.current = connection;
    setConnectionState('connected');
    reconnectAttemptRef.current = 0;
  }, [buildConnection, setupEventHandlers, onError]);

  // ============================================================================
  // Disconnect
  // ============================================================================

  const disconnect = useCallback(async () => {
    // Capture current connection before async operation
    const currentConnection = connectionRef.current;
    if (!currentConnection) return;

    // Clear ref immediately to prevent race conditions
    connectionRef.current = null;

    try {
      await currentConnection.stop();
    } catch (err) {
      console.error('Error disconnecting from SignalR:', err);
    } finally {
      if (isMountedRef.current) {
        setConnectionState('disconnected');
      }
    }
  }, []);

  // ============================================================================
  // Send Methods
  // ============================================================================

  const sendE2EE = useCallback(
    async (message: E2EEOutboundMessage): Promise<E2EEOperationResult> => {
      if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
        return {
          success: false,
          errorCode: 'NOT_CONNECTED',
          errorMessage: 'SignalR connection not available',
        };
      }

      return sendE2EEMessage(connectionRef.current, message);
    },
    []
  );

  const sendOffer = useCallback(
    async (targetUserId: string, sdp: string) => {
      if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
        throw new WebRTCError(WebRTCErrorCode.SIGNALING_FAILED, NOT_CONNECTED_ERROR);
      }

      await connectionRef.current.invoke('SendOffer', roomId, targetUserId, sdp);
    },
    [roomId]
  );

  const sendAnswer = useCallback(
    async (targetUserId: string, sdp: string) => {
      if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
        throw new WebRTCError(WebRTCErrorCode.SIGNALING_FAILED, NOT_CONNECTED_ERROR);
      }

      await connectionRef.current.invoke('SendAnswer', roomId, targetUserId, sdp);
    },
    [roomId]
  );

  const sendIceCandidate = useCallback(
    async (targetUserId: string, candidate: string) => {
      if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
        throw new WebRTCError(WebRTCErrorCode.SIGNALING_FAILED, NOT_CONNECTED_ERROR);
      }

      await connectionRef.current.invoke('SendIceCandidate', roomId, targetUserId, candidate);
    },
    [roomId]
  );

  const joinRoom = useCallback(async () => {
    if (!connectionRef.current || connectionRef.current.state !== HubConnectionState.Connected) {
      throw new WebRTCError(WebRTCErrorCode.SIGNALING_FAILED, NOT_CONNECTED_ERROR);
    }

    await connectionRef.current.invoke('JoinRoom', roomId);
  }, [roomId]);

  // ============================================================================
  // Auto Connect Effect
  // ============================================================================

  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect && roomId) {
      void connect();
    }

    return () => {
      isMountedRef.current = false;
      void disconnect();
    };
  }, [autoConnect, roomId, connect, disconnect]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    connection: connectionRef.current,
    connectionState,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    sendE2EEMessage: sendE2EE,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    joinRoom,
    error,
  };
}

export default useSignalRHub;
