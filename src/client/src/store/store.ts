import { configureStore, isRejectedWithValue } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import skills from '../features/skills/skillsSlice';
import category from '../features/skills/categorySlice';
import proficiencyLevel from '../features/skills/proficiencyLevelSlice';
import search from '../features/search/searchSlice';
import matchmaking from '../features/matchmaking/matchmakingSlice';
import appointments from '../features/appointments/appointmentsSlice';
import videoCall from '../features/videocall/videoCallSlice';
import notifications from '../features/notifications/notificationSlice';
import admin from '../features/admin/adminSlice';
import { performanceMonitor } from '../utils/performance';

/**
 * Middleware for error handling and logging
 */
const errorHandlingMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (isRejectedWithValue(action)) {
    console.error('🚨 Redux Action Rejected:', {
      type: action.type,
      error: action.payload,
      timestamp: new Date().toISOString(),
    });

    // Track API performance on errors
    if (action.type.includes('api') || action.type.includes('fetch')) {
      performanceMonitor.measureApiResponse(action.type, -1); // -1 indicates error
    }
  }

  return result;
};

/**
 * Middleware for performance monitoring
 */
const performanceMiddleware: Middleware = () => (next) => (action) => {
  const start = performance.now();
  const result = next(action);
  const end = performance.now();
  const duration = end - start;

  // Log slow actions (> 100ms)
  if (duration > 100 && action && typeof action === 'object' && 'type' in action) {
    console.warn(`🐌 Slow Redux Action: ${(action as any).type} took ${duration.toFixed(2)}ms`);
  }

  // Track API actions specifically
  if (action && typeof action === 'object' && 'type' in action) {
    const actionType = (action as any).type;
    if (actionType.includes('/fulfilled') && actionType.includes('fetch')) {
      performanceMonitor.measureApiResponse(actionType, duration);
    }
  }

  return result;
};

/**
 * Enhanced store configuration with performance optimizations
 */
export const store = configureStore({
  reducer: {
    auth,
    skills,
    category,
    proficiencyLevel,
    search,
    matchmaking,
    appointments,
    videoCall,
    notifications,
    admin,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredActions: [
          'videoCall/setLocalStream',
          'videoCall/setRemoteStream',
          'notifications/addNotification',
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
        ignoredPaths: [
          'videoCall.localStream', 
          'videoCall.remoteStream',
          'notifications.lastNotification.timestamp',
          'appointments.selectedDate',
        ],
      },
      immutableCheck: {
        // Ignore large objects that are expensive to check
        ignoredPaths: ['videoCall', 'admin.analytics'],
      },
    })
    .concat(errorHandlingMiddleware)
    .concat(performanceMiddleware),

  // Enable Redux DevTools with performance options
  devTools: process.env.NODE_ENV !== 'production' && {
    maxAge: 50, // Limit action history for performance
    trace: true,
    traceLimit: 25,
    actionSanitizer: (action: any) => {
      // Sanitize large payloads in DevTools
      if (action.type.includes('fetchLarge') || action.payload?.data?.length > 100) {
        return {
          ...action,
          payload: {
            ...action.payload,
            data: `[Array of ${action.payload?.data?.length} items]`
          }
        };
      }
      return action;
    },
    stateSanitizer: (state: any) => {
      // Sanitize large state objects
      return {
        ...state,
        videoCall: {
          ...state.videoCall,
          localStream: state.videoCall.localStream ? '[MediaStream]' : null,
          remoteStream: state.videoCall.remoteStream ? '[MediaStream]' : null,
        }
      };
    }
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
