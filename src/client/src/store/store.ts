import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import skills from '../features/skills/skillsSlice';
import category from '../features/skills/categorySlice';
import proficiencyLevel from '../features/skills/profiencyLevelSlice';
import search from '../features/search/searchSlice';
import matchmaking from '../features/matchmaking/matchmakingSlice';
import appointments from '../features/appointments/appointmentsSlice';
import videoCall from '../features/videocall/videoCallSlice';

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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredActions: [
          'videoCall/setLocalStream',
          'videoCall/setRemoteStream',
        ],
        ignoredPaths: ['videoCall.localStream', 'videoCall.remoteStream'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
