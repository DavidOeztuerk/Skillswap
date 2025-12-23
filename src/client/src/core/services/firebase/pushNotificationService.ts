import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';
import { apiClient } from '../../api/apiClient';
import { NOTIFICATION_ENDPOINTS } from '../../config/endpoints';
import { firebaseConfig, vapidKey, isFirebaseConfigured } from '../../config/firebase';

/**
 * Push notification payload type
 */
export interface PushNotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    image?: string;
  };
  data?: Record<string, string>;
}

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app
 */
export const initializeFirebase = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured. Push notifications will be unavailable.');
    return null;
  }

  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }

  return firebaseApp;
};

/**
 * Get Firebase Messaging instance
 */
export const getFirebaseMessaging = (): Messaging | null => {
  firebaseApp ??= initializeFirebase();

  if (!firebaseApp) {
    return null;
  }

  if (!messaging) {
    try {
      messaging = getMessaging(firebaseApp);
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
      return null;
    }
  }

  return messaging;
};

/**
 * Check if push notifications are supported
 */
export const isPushNotificationSupported = (): boolean =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'denied';
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
};

/**
 * Register service worker for Firebase messaging
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    console.debug('Service Worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Get FCM token for push notifications
 */
export const getFCMToken = async (): Promise<string | null> => {
  const msgInstance = getFirebaseMessaging();
  if (!msgInstance) {
    console.warn('Firebase Messaging is not available');
    return null;
  }

  if (vapidKey.length === 0) {
    console.error('VAPID key is not configured');
    return null;
  }

  try {
    // Ensure service worker is registered
    const registration = await registerServiceWorker();
    if (!registration) {
      return null;
    }

    const token = await getToken(msgInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.debug(`FCM Token obtained: ${token.slice(0, 20)}...`);
      return token;
    }
    console.warn('No FCM token available');
    return null;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
};

/**
 * Save FCM token to backend
 */
export const savePushToken = async (token: string): Promise<boolean> => {
  try {
    const response = await apiClient.post(NOTIFICATION_ENDPOINTS.PUSH_TOKEN, { token });
    return response.success;
  } catch (error) {
    console.error('Failed to save push token to backend:', error);
    return false;
  }
};

/**
 * Subscribe to foreground messages
 */
export const onForegroundMessage = (
  callback: (payload: PushNotificationPayload) => void
): (() => void) => {
  const msgInstance = getFirebaseMessaging();
  if (!msgInstance) {
    // Return no-op unsubscribe function if messaging not available
    return () => {
      /* no-op */
    };
  }

  return onMessage(msgInstance, (payload: MessagePayload) => {
    console.debug('Foreground message received:', payload);
    callback(payload as PushNotificationPayload);
  });
};

/**
 * Full push notification setup flow
 * 1. Check support
 * 2. Request permission
 * 3. Register service worker
 * 4. Get FCM token
 * 5. Save token to backend
 */
export const setupPushNotifications = async (): Promise<{
  success: boolean;
  token: string | null;
  error?: string;
}> => {
  // Check browser support
  if (!isPushNotificationSupported()) {
    return { success: false, token: null, error: 'Push notifications not supported' };
  }

  // Check Firebase configuration
  if (!isFirebaseConfigured()) {
    return { success: false, token: null, error: 'Firebase not configured' };
  }

  // Request permission
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { success: false, token: null, error: 'Permission denied' };
  }

  // Get FCM token
  const token = await getFCMToken();
  if (!token) {
    return { success: false, token: null, error: 'Failed to get FCM token' };
  }

  // Save token to backend
  const saved = await savePushToken(token);
  if (!saved) {
    console.warn('Token obtained but failed to save to backend');
  }

  return { success: true, token };
};

/**
 * Show local notification (for foreground messages)
 */
export const showLocalNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    // eslint-disable-next-line no-new
    new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options,
    });
  }
};
