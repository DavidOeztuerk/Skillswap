import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  startSession,
  completeSession,
  rateSession,
  rescheduleSession,
  cancelSession,
  processSessionPayment,
} from './sessionsThunks';

/**
 * Session state interfaces
 */
export interface SessionStatus {
  sessionAppointmentId: string;
  status: string;
  timestamp?: string | null;
  meetingLink?: string | null;
}

export interface SessionRating {
  ratingId: string;
  rating: number;
  feedback?: string | null;
  createdAt: string;
}

export interface SessionPayment {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  transactionId?: string | null;
  processedAt?: string | null;
}

export interface SessionError {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Session lifecycle state
 */
export interface SessionState {
  // Current session being viewed/interacted with
  currentSession: SessionStatus | null;
  currentRating: SessionRating | null;
  currentPayment: SessionPayment | null;

  // Loading and error states
  isLoading: boolean;
  isLoadingPayment: boolean;
  error: SessionError | null;

  // Session history/list
  sessionHistory: SessionStatus[];
  ratings: SessionRating[];
  payments: SessionPayment[];

  // UI state
  activeSessionId: string | null;
  showRatingForm: boolean;
  showPaymentForm: boolean;
  showRescheduleForm: boolean;
}

const initialState: SessionState = {
  currentSession: null,
  currentRating: null,
  currentPayment: null,
  isLoading: false,
  isLoadingPayment: false,
  error: null,
  sessionHistory: [],
  ratings: [],
  payments: [],
  activeSessionId: null,
  showRatingForm: false,
  showPaymentForm: false,
  showRescheduleForm: false,
};

/**
 * SESSIONS SLICE - Session Lifecycle Management
 *
 * Manages the complete session lifecycle:
 * - Starting sessions
 * - Completing sessions and marking no-shows
 * - Rating sessions with feedback
 * - Processing payments
 * - Requesting rescheduling
 * - Canceling sessions
 */
const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    // ==================== UI STATE MANAGEMENT ====================
    setActiveSession: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
      state.error = null;
    },

    setShowRatingForm: (state, action: PayloadAction<boolean>) => {
      state.showRatingForm = action.payload;
    },

    setShowPaymentForm: (state, action: PayloadAction<boolean>) => {
      state.showPaymentForm = action.payload;
    },

    setShowRescheduleForm: (state, action: PayloadAction<boolean>) => {
      state.showRescheduleForm = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearCurrentSession: (state) => {
      state.currentSession = null;
      state.currentRating = null;
      state.currentPayment = null;
      state.activeSessionId = null;
    },

    // ==================== HISTORY MANAGEMENT ====================
    addSessionToHistory: (state, action: PayloadAction<SessionStatus>) => {
      // Check if session already exists
      const existingIndex = state.sessionHistory.findIndex(
        (s) => s.sessionAppointmentId === action.payload.sessionAppointmentId
      );

      if (existingIndex >= 0) {
        // Update existing
        state.sessionHistory[existingIndex] = action.payload;
      } else {
        // Add new
        state.sessionHistory.unshift(action.payload);
      }
    },

    addRatingToHistory: (state, action: PayloadAction<SessionRating>) => {
      const existingIndex = state.ratings.findIndex((r) => r.ratingId === action.payload.ratingId);

      if (existingIndex >= 0) {
        state.ratings[existingIndex] = action.payload;
      } else {
        state.ratings.unshift(action.payload);
      }
    },

    addPaymentToHistory: (state, action: PayloadAction<SessionPayment>) => {
      const existingIndex = state.payments.findIndex((p) => p.paymentId === action.payload.paymentId);

      if (existingIndex >= 0) {
        state.payments[existingIndex] = action.payload;
      } else {
        state.payments.unshift(action.payload);
      }
    },

    clearSessionHistory: (state) => {
      state.sessionHistory = [];
      state.ratings = [];
      state.payments = [];
    },
  },

  extraReducers: (builder) => {
    builder
      // ==================== START SESSION ====================
      .addCase(startSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startSession.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && 'data' in action.payload && action.payload.data) {
          const data = action.payload.data;
          state.currentSession = data;
          // Add to history
          const existingIndex = state.sessionHistory.findIndex(
            (s) => s.sessionAppointmentId === data.sessionAppointmentId
          );
          if (existingIndex >= 0) {
            state.sessionHistory[existingIndex] = data;
          } else {
            state.sessionHistory.unshift(data);
          }
        }
      })
      .addCase(startSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = {
          code: action.payload?.code,
          message: action.payload?.message || 'Failed to start session',
          details: action.payload?.details,
        };
      })

      // ==================== COMPLETE SESSION ====================
      .addCase(completeSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeSession.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && 'data' in action.payload && action.payload.data) {
          const data = action.payload.data;
          state.currentSession = data;
          // Add to history
          const existingIndex = state.sessionHistory.findIndex(
            (s) => s.sessionAppointmentId === data.sessionAppointmentId
          );
          if (existingIndex >= 0) {
            state.sessionHistory[existingIndex] = data;
          } else {
            state.sessionHistory.unshift(data);
          }
          // Show rating form after completion
          state.showRatingForm = true;
        }
      })
      .addCase(completeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = {
          code: action.payload?.code,
          message: action.payload?.message || 'Failed to complete session',
          details: action.payload?.details,
        };
      })

      // ==================== RATE SESSION ====================
      .addCase(rateSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rateSession.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && 'data' in action.payload && action.payload.data) {
          const data = action.payload.data;
          state.currentRating = data;
          // Add rating to history
          const existingIndex = state.ratings.findIndex(
            (r) => r.ratingId === data.ratingId
          );
          if (existingIndex >= 0) {
            state.ratings[existingIndex] = data;
          } else {
            state.ratings.unshift(data);
          }
          state.showRatingForm = false;
        }
      })
      .addCase(rateSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = {
          code: action.payload?.code,
          message: action.payload?.message || 'Failed to rate session',
          details: action.payload?.details,
        };
      })

      // ==================== RESCHEDULE SESSION ====================
      .addCase(rescheduleSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rescheduleSession.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && 'data' in action.payload && action.payload.data) {
          const data = action.payload.data;
          state.currentSession = data;
          // Add to history
          const existingIndex = state.sessionHistory.findIndex(
            (s) => s.sessionAppointmentId === data.sessionAppointmentId
          );
          if (existingIndex >= 0) {
            state.sessionHistory[existingIndex] = data;
          } else {
            state.sessionHistory.unshift(data);
          }
          state.showRescheduleForm = false;
        }
      })
      .addCase(rescheduleSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = {
          code: action.payload?.code,
          message: action.payload?.message || 'Failed to reschedule session',
          details: action.payload?.details,
        };
      })

      // ==================== CANCEL SESSION ====================
      .addCase(cancelSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelSession.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && 'data' in action.payload && action.payload.data) {
          const data = action.payload.data;
          state.currentSession = data;
          // Add to history
          const existingIndex = state.sessionHistory.findIndex(
            (s) => s.sessionAppointmentId === data.sessionAppointmentId
          );
          if (existingIndex >= 0) {
            state.sessionHistory[existingIndex] = data;
          } else {
            state.sessionHistory.unshift(data);
          }
        }
      })
      .addCase(cancelSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = {
          code: action.payload?.code,
          message: action.payload?.message || 'Failed to cancel session',
          details: action.payload?.details,
        };
      })

      // ==================== PROCESS PAYMENT ====================
      .addCase(processSessionPayment.pending, (state) => {
        state.isLoadingPayment = true;
        state.error = null;
      })
      .addCase(processSessionPayment.fulfilled, (state, action) => {
        state.isLoadingPayment = false;

        if (action.payload.success && 'data' in action.payload && action.payload.data) {
          const data = action.payload.data;
          state.currentPayment = data;
          // Add payment to history
          const existingIndex = state.payments.findIndex(
            (p) => p.paymentId === data.paymentId
          );
          if (existingIndex >= 0) {
            state.payments[existingIndex] = data;
          } else {
            state.payments.unshift(data);
          }
          state.showPaymentForm = false;
        }
      })
      .addCase(processSessionPayment.rejected, (state, action) => {
        state.isLoadingPayment = false;
        state.error = {
          code: action.payload?.code,
          message: action.payload?.message || 'Failed to process payment',
          details: action.payload?.details,
        };
      });
  },
});

export const {
  setActiveSession,
  setShowRatingForm,
  setShowPaymentForm,
  setShowRescheduleForm,
  clearError,
  clearCurrentSession,
  addSessionToHistory,
  addRatingToHistory,
  addPaymentToHistory,
  clearSessionHistory,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;
