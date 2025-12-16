import { useEffect, useRef, useCallback, useState } from 'react';

export interface AutoReconnectOptions {
  maxRetries?: number;
  retryDelay?: number; // Initial delay in ms
  maxRetryDelay?: number; // Max delay in ms
  backoffMultiplier?: number; // Exponential backoff multiplier
  onReconnecting?: (attempt: number, delay: number) => void;
  onReconnected?: () => void;
  onReconnectFailed?: () => void;
}

interface UseAutoReconnectReturn {
  isReconnecting: boolean;
  attemptCount: number;
  cancel: () => void;
}

/**
 * Auto-Reconnect Hook
 * Automatically reconnects SignalR/WebRTC connections with exponential backoff
 * @param isConnected - Current connection status
 * @param reconnectFn - Function to call to attempt reconnection
 * @param options - Configuration options for retry behavior
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

  const attemptCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasConnectedRef = useRef(false);
  const isReconnectingRef = useRef(false);

  const clearReconnectTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const calculateDelay = useCallback(
    (attempt: number): number => {
      const delay = Math.min(retryDelay * Math.pow(backoffMultiplier, attempt - 1), maxRetryDelay);
      // Add jitter (±20%)
      const jitter = delay * 0.2 * (Math.random() - 0.5);
      return Math.round(delay + jitter);
    },
    [retryDelay, backoffMultiplier, maxRetryDelay]
  );

  // Use a ref to hold the reconnect function so it can call itself without dependency issues
  const attemptReconnectRef = useRef<(() => void) | null>(null);

  const attemptReconnect = useCallback(() => {
    if (isReconnectingRef.current) {
      console.debug('🔄 [AutoReconnect] Already reconnecting, skipping...');
      return;
    }

    attemptCountRef.current += 1;
    const currentAttempt = attemptCountRef.current;

    if (currentAttempt > maxRetries) {
      console.error('❌ [AutoReconnect] Max retries exceeded, giving up');
      isReconnectingRef.current = false;
      onReconnectFailed?.();
      return;
    }

    const delay = calculateDelay(currentAttempt);
    console.debug(
      `🔄 [AutoReconnect] Attempt ${String(currentAttempt)}/${String(maxRetries)} in ${String(delay)}ms...`
    );

    onReconnecting?.(currentAttempt, delay);
    isReconnectingRef.current = true;

    timeoutRef.current = setTimeout(() => {
      reconnectFn()
        .then(() => {
          console.debug('✅ [AutoReconnect] Reconnection successful');
          attemptCountRef.current = 0;
          isReconnectingRef.current = false;
          onReconnected?.();
        })
        .catch((error: unknown) => {
          console.error('❌ [AutoReconnect] Reconnection failed:', error);
          isReconnectingRef.current = false;
          // Try again using ref to avoid accessing before declaration
          attemptReconnectRef.current?.();
        });
    }, delay);
  }, [maxRetries, calculateDelay, reconnectFn, onReconnecting, onReconnected, onReconnectFailed]);

  // Keep the ref updated with the latest function - move to useEffect to avoid ref access during render
  useEffect(() => {
    attemptReconnectRef.current = attemptReconnect;
  }, [attemptReconnect]);

  // State for values that need to be returned to consumers
  const [reconnectState, setReconnectState] = useState({
    isReconnecting: false,
    attemptCount: 0,
  });

  useEffect(() => {
    // Track if we were previously connected
    if (isConnected) {
      wasConnectedRef.current = true;
      attemptCountRef.current = 0;
      clearReconnectTimeout();
      isReconnectingRef.current = false;
      const timer = setTimeout(() => {
        setReconnectState({ isReconnecting: false, attemptCount: 0 });
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }

    // If we lose connection and we were previously connected, start reconnecting
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- wasConnectedRef starts false, becomes true on first connect
    if (!isConnected && wasConnectedRef.current && !isReconnectingRef.current) {
      console.warn('⚠️ [AutoReconnect] Connection lost, starting auto-reconnect...');
      attemptReconnect();
    }

    return () => {
      clearReconnectTimeout();
    };
  }, [isConnected, attemptReconnect, clearReconnectTimeout]);

  // Sync state with refs when they change
  useEffect(() => {
    const syncInterval = setInterval(() => {
      setReconnectState((prev) => {
        if (
          prev.isReconnecting !== isReconnectingRef.current ||
          prev.attemptCount !== attemptCountRef.current
        ) {
          return {
            isReconnecting: isReconnectingRef.current,
            attemptCount: attemptCountRef.current,
          };
        }
        return prev;
      });
    }, 100);
    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  return {
    isReconnecting: reconnectState.isReconnecting,
    attemptCount: reconnectState.attemptCount,
    cancel: clearReconnectTimeout,
  };
};
