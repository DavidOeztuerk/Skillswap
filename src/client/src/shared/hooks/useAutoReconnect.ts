import { useEffect, useRef, useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface AutoReconnectOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  backoffMultiplier?: number;
  onReconnecting?: (attempt: number, delay: number) => void;
  onReconnected?: () => void;
  onReconnectFailed?: () => void;
}

interface UseAutoReconnectReturn {
  isReconnecting: boolean;
  attemptCount: number;
  cancel: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Auto-Reconnect Hook
 *
 * @description Automatically reconnects SignalR/WebRTC connections with exponential backoff.
 */
export const useAutoReconnect = (
  isConnected: boolean,
  reconnectFn: () => Promise<void>,
  options: AutoReconnectOptions = {}
): UseAutoReconnectReturn => {
  const {
    maxRetries = 5,
    retryDelay = 1000,
    maxRetryDelay = 30000,
    backoffMultiplier = 2,
    onReconnecting,
    onReconnected,
    onReconnectFailed,
  } = options;

  // State
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Refs
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIsConnectedRef = useRef(isConnected);
  const isCancelledRef = useRef(false);

  // Store reconnect function in ref for recursive calls
  const attemptReconnectRef = useRef<(currentAttempt: number) => void>(() => {});

  const clearReconnectTimeout = useCallback((): void => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const calculateDelay = useCallback(
    (attempt: number): number => {
      const delay = Math.min(retryDelay * backoffMultiplier ** (attempt - 1), maxRetryDelay);
      const jitter = delay * 0.2 * (Math.random() - 0.5);
      return Math.round(delay + jitter);
    },
    [retryDelay, backoffMultiplier, maxRetryDelay]
  );

  const cancel = useCallback((): void => {
    isCancelledRef.current = true;
    clearReconnectTimeout();
    setIsReconnecting(false);
    setAttemptCount(0);
  }, [clearReconnectTimeout]);

  // Define reconnect logic - stored in ref for recursive calls
  useEffect(() => {
    attemptReconnectRef.current = (currentAttempt: number): void => {
      if (isCancelledRef.current) {
        return;
      }

      if (currentAttempt > maxRetries) {
        console.error('❌ [AutoReconnect] Max retries exceeded, giving up');
        setIsReconnecting(false);
        setAttemptCount(0);
        onReconnectFailed?.();
        return;
      }

      const delay = calculateDelay(currentAttempt);
      console.debug(`🔄 [AutoReconnect] Attempt ${currentAttempt}/${maxRetries} in ${delay}ms...`);

      setIsReconnecting(true);
      setAttemptCount(currentAttempt);
      onReconnecting?.(currentAttempt, delay);

      timeoutRef.current = setTimeout(() => {
        if (isCancelledRef.current) {
          return;
        }

        reconnectFn()
          .then(() => {
            if (isCancelledRef.current) {
              return;
            }
            console.debug('✅ [AutoReconnect] Reconnection successful');
            setIsReconnecting(false);
            setAttemptCount(0);
            onReconnected?.();
          })
          .catch((error: unknown) => {
            if (isCancelledRef.current) {
              return;
            }
            console.error('❌ [AutoReconnect] Reconnection failed:', error);
            // Recursive call via ref
            attemptReconnectRef.current(currentAttempt + 1);
          });
      }, delay);
    };
  }, [maxRetries, calculateDelay, reconnectFn, onReconnecting, onReconnected, onReconnectFailed]);

  // Handle connection state changes
  useEffect(() => {
    const wasConnected = prevIsConnectedRef.current;
    prevIsConnectedRef.current = isConnected;

    // Connection restored
    if (isConnected && !wasConnected) {
      isCancelledRef.current = false;
      clearReconnectTimeout();
      //setIsReconnecting(false);
      //setAttemptCount(0);
      return;
    }

    // Connection lost - start reconnecting
    if (!isConnected && wasConnected && !isReconnecting) {
      console.warn('⚠️ [AutoReconnect] Connection lost, starting auto-reconnect...');
      isCancelledRef.current = false;
      attemptReconnectRef.current(1);
    }

    return () => {
      clearReconnectTimeout();
    };
  }, [isConnected, isReconnecting, clearReconnectTimeout]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      isCancelledRef.current = true;
      clearReconnectTimeout();
    },
    [clearReconnectTimeout]
  );

  return {
    isReconnecting,
    attemptCount,
    cancel,
  };
};

export default useAutoReconnect;
