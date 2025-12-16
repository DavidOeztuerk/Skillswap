import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import skills from '../features/skills/skillsSlice';
import category from '../features/skills/categorySlice';
import proficiencyLevel from '../features/skills/proficiencyLevelSlice';
import search from '../features/search/searchSlice';
import matchmaking from '../features/matchmaking/matchmakingSlice';
import appointments from '../features/appointments/appointmentsSlice';
import sessions from '../features/sessions/sessionsSlice';
import videoCall from '../features/videocall/videoCallSlice';
import preCall from '../features/videocall/preCallSlice';
import notifications from '../features/notifications/notificationSlice';
import admin from '../features/admin/adminSlice';

export const store = configureStore({
  reducer: {
    auth,
    skills,
    category,
    proficiencyLevel,
    search,
    matchmaking,
    appointments,
    sessions,
    videoCall,
    preCall,
    notifications,
    admin,
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { createAppAsyncThunk } from './thunkHelpers';
