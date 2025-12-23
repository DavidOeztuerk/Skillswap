// Firebase Web SDK Configuration
// These values should be set via environment variables in production

const getEnvVar = (key: string): string => {
  const value: unknown = import.meta.env[key];
  return typeof value === 'string' ? value : '';
};

export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

// VAPID key for web push notifications
export const vapidKey = getEnvVar('VITE_FIREBASE_VAPID_KEY');

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean =>
  firebaseConfig.apiKey.length > 0 &&
  firebaseConfig.projectId.length > 0 &&
  firebaseConfig.messagingSenderId.length > 0 &&
  vapidKey.length > 0;
