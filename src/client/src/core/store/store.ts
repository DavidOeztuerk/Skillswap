import { configureStore } from '@reduxjs/toolkit';
import admin from '../../features/admin/store/adminSlice';
import appointments from '../../features/appointments/store/appointmentsSlice';
import auth from '../../features/auth/store/authSlice';
import chat from '../../features/chat/store/chatSlice';
import matchmaking from '../../features/matchmaking/store/matchmakingSlice';
import notifications from '../../features/notifications/store/notificationSlice';
import profile from '../../features/profile/store/profileSlice';
import socialConnections from '../../features/profile/store/socialConnectionsSlice';
import search from '../../features/search/store/searchSlice';
import sessions from '../../features/sessions/store/sessionsSlice';
import category from '../../features/skills/store/categorySlice';
import skills from '../../features/skills/store/skillsSlice';
import preCall from '../../features/videocall/store/preCallSlice';
import videoCall from '../../features/videocall/store/videoCallSlice';
import { setErrorServiceStore } from '../services/errorService';

export const store = configureStore({
  reducer: {
    auth,
    skills,
    category,
    profile,
    socialConnections,
    search,
    matchmaking,
    appointments,
    sessions,
    videoCall,
    preCall,
    notifications,
    admin,
    chat,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore MediaStream objects in videoCall state (they are DOM objects and non-serializable)
        ignoredActions: ['videoCall/setLocalStream', 'videoCall/setRemoteStream'],
        ignoredPaths: ['videoCall.localStream', 'videoCall.remoteStream'],
      },
    }),
});

// Initialize errorService with store access for notifications and user context
setErrorServiceStore(store.dispatch, () => store.getState());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
