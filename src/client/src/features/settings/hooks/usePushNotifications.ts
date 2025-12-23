import { useState, useCallback, useEffect } from 'react';
import { isFirebaseConfigured } from '../../../core/config/firebase';
import {
  type PushNotificationPayload,
  isPushNotificationSupported,
  getNotificationPermission,
  setupPushNotifications,
  showLocalNotification,
  onForegroundMessage,
} from '../../../core/services/firebase/pushNotificationService';

export interface PushNotificationState {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Whether Firebase is properly configured (env vars set) */
  isConfigured: boolean;
  /** Current permission status: 'default' | 'granted' | 'denied' */
  permission: NotificationPermission;
  /** Whether push notifications are fully enabled (supported + granted + token saved) */
  isEnabled: boolean;
  /** Whether we're currently setting up push notifications */
  isLoading: boolean;
  /** The FCM token if successfully registered */
  token: string | null;
  /** Error message if setup failed */
  error: string | null;
}

export interface UsePushNotificationsReturn extends PushNotificationState {
  /** Enable push notifications - requests permission, gets token, saves to backend */
  enablePushNotifications: () => Promise<boolean>;
  /** Check if permission was previously denied (user must change in browser settings) */
  isPermissionDenied: boolean;
  /** Check if permission is still in default state (not yet asked) */
  isPermissionDefault: boolean;
  /** Check if push can be enabled (supported + configured + not already enabled) */
  canEnable: boolean;
  /** Callback to handle incoming foreground notifications */
  onNotification: (callback: (payload: PushNotificationPayload) => void) => () => void;
}

/**
 * PUSH NOTIFICATIONS HOOK
 *
 * Manages Firebase Cloud Messaging (FCM) push notification state and setup.
 *
 * Features:
 * - Check browser support for push notifications
 * - Request notification permission
 * - Register FCM token with backend
 * - Subscribe to foreground messages
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isConfigured: false,
    permission: 'default',
    isEnabled: false,
    isLoading: false,
    token: null,
    error: null,
  });

  // Initialize on mount - check support, config, and current permission
  useEffect(() => {
    const checkSupport = (): void => {
      const supported = isPushNotificationSupported();
      const configured = isFirebaseConfigured();
      const currentPermission = supported ? getNotificationPermission() : 'denied';

      setState((prev) => ({
        ...prev,
        isSupported: supported,
        isConfigured: configured,
        permission: currentPermission,
      }));
    };

    checkSupport();
  }, []);

  /**
   * Enable push notifications
   * - Requests permission if not yet granted
   * - Gets FCM token
   * - Saves token to backend
   */
  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    // Pre-checks
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Push notifications not supported in this browser' }));
      return false;
    }
    if (!state.isConfigured) {
      setState((prev) => ({ ...prev, error: 'Firebase is not configured' }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await setupPushNotifications();

      if (result.success && result.token) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isEnabled: true,
          token: result.token,
          permission: 'granted',
          error: null,
        }));
        return true;
      }
      // Check if permission was denied
      const currentPermission = getNotificationPermission();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isEnabled: false,
        permission: currentPermission,
        error: result.error ?? 'Failed to enable push notifications',
      }));
      return false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error enabling push notifications';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [state.isSupported, state.isConfigured]);

  /**
   * Subscribe to foreground notifications
   * Returns unsubscribe function
   */
  const onNotification = useCallback(
    (callback: (payload: PushNotificationPayload) => void): (() => void) => {
      // Default behavior: show local notification for foreground messages
      const wrappedCallback = (payload: PushNotificationPayload): void => {
        // Call user's callback first
        callback(payload);

        // Optionally show local notification for foreground messages
        if (payload.notification?.title) {
          showLocalNotification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon ?? '/logo192.png',
            data: payload.data,
          });
        }
      };

      return onForegroundMessage(wrappedCallback);
    },
    []
  );

  // Computed values
  const isPermissionDenied = state.permission === 'denied';
  const isPermissionDefault = state.permission === 'default';
  const canEnable =
    state.isSupported && state.isConfigured && !state.isEnabled && !isPermissionDenied;

  return {
    // State
    ...state,

    // Computed values
    isPermissionDenied,
    isPermissionDefault,
    canEnable,

    // Actions
    enablePushNotifications,
    onNotification,
  };
};

export default usePushNotifications;
