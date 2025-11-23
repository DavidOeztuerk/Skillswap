import { useEffect, useRef, useCallback } from 'react';

export interface AutoReconnectOptions {
  maxRetries?: number;
  retryDelay?: number; // Initial delay in ms
  maxRetryDelay?: number; // Max delay in ms
  backoffMultiplier?: number; // Exponential backoff multiplier
  onReconnecting?: (attempt: number, delay: number) => void;
  onReconnected?: () => void;
  onReconnectFailed?: () => void;
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
) => {
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
      const delay = Math.min(
        retryDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxRetryDelay
      );
      // Add jitter (±20%)
      const jitter = delay * 0.2 * (Math.random() - 0.5);
      return Math.round(delay + jitter);
    },
    [retryDelay, backoffMultiplier, maxRetryDelay]
  );

  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current) {
      console.log('🔄 [AutoReconnect] Already reconnecting, skipping...');
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
    console.log(
      `🔄 [AutoReconnect] Attempt ${currentAttempt}/${maxRetries} in ${delay}ms...`
    );

    onReconnecting?.(currentAttempt, delay);
    isReconnectingRef.current = true;

    timeoutRef.current = setTimeout(async () => {
      try {
        await reconnectFn();
        console.log('✅ [AutoReconnect] Reconnection successful');
        attemptCountRef.current = 0;
        isReconnectingRef.current = false;
        onReconnected?.();
      } catch (error) {
        console.error('❌ [AutoReconnect] Reconnection failed:', error);
        isReconnectingRef.current = false;
        // Try again
        attemptReconnect();
      }
    }, delay);
  }, [
    maxRetries,
    calculateDelay,
    reconnectFn,
    onReconnecting,
    onReconnected,
    onReconnectFailed,
  ]);

  useEffect(() => {
    // Track if we were previously connected
    if (isConnected) {
      wasConnectedRef.current = true;
      attemptCountRef.current = 0; // Reset retry counter on successful connection
      clearReconnectTimeout();
      isReconnectingRef.current = false;
    }

    // If we lose connection and we were previously connected, start reconnecting
    if (!isConnected && wasConnectedRef.current && !isReconnectingRef.current) {
      console.warn('⚠️ [AutoReconnect] Connection lost, starting auto-reconnect...');
      attemptReconnect();
    }

    return () => {
      clearReconnectTimeout();
    };
  }, [isConnected, attemptReconnect, clearReconnectTimeout]);

  return {
    isReconnecting: isReconnectingRef.current,
    attemptCount: attemptCountRef.current,
    cancel: clearReconnectTimeout,
  };
};
