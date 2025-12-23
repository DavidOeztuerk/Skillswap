import { createAsyncThunk } from '@reduxjs/toolkit';
import sessionService, {
  type SessionStatusResponse,
  type CompleteSessionRequest,
  type RatingResponse,
  type RateSessionRequest,
  type RescheduleSessionRequest,
  type ProcessSessionPaymentRequest,
  type PaymentResponse,
} from '../services/sessionService';
import type { ApiResponse } from '../../../shared/types/api/UnifiedResponse';

// Constants
const UNKNOWN_ERROR = 'An unknown error occurred';

/**
 * Thunk error type for better type safety
 */
export interface SessionThunkError {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * START SESSION THUNK
 * Initiates a confirmed appointment session
 * Typically called 5 minutes before scheduled time
 */
export const startSession = createAsyncThunk<
  ApiResponse<SessionStatusResponse>,
  string,
  { rejectValue: SessionThunkError }
>('sessions/startSession', async (appointmentId: string, { rejectWithValue }) => {
  try {
    const response = await sessionService.startSession(appointmentId);

    if (!response.success) {
      return rejectWithValue({
        message: response.message ?? 'Failed to start session',
      });
    }

    return response;
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });
  }
});

/**
 * COMPLETE SESSION THUNK
 * Marks a session as completed or no-show
 * Called after session ends
 */
export const completeSession = createAsyncThunk<
  ApiResponse<SessionStatusResponse>,
  { appointmentId: string; request?: CompleteSessionRequest },
  { rejectValue: SessionThunkError }
>('sessions/completeSession', async ({ appointmentId, request }, { rejectWithValue }) => {
  try {
    const response = await sessionService.completeSession(appointmentId, request);

    if (!response.success) {
      return rejectWithValue({
        message: response.message ?? 'Failed to complete session',
      });
    }

    return response;
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });
  }
});

/**
 * RATE SESSION THUNK
 * Submits a rating and feedback for a completed session
 * Called after session completion
 */
export const rateSession = createAsyncThunk<
  ApiResponse<RatingResponse>,
  { appointmentId: string; request: RateSessionRequest },
  { rejectValue: SessionThunkError }
>('sessions/rateSession', async ({ appointmentId, request }, { rejectWithValue }) => {
  try {
    const response = await sessionService.rateSession(appointmentId, request);

    if (!response.success) {
      return rejectWithValue({
        message: response.message ?? 'Failed to rate session',
      });
    }

    return response;
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });
  }
});

/**
 * RESCHEDULE SESSION THUNK
 * Requests to reschedule a session to a new date
 * Creates a reschedule request for the other participant to approve
 */
export const rescheduleSession = createAsyncThunk<
  ApiResponse<SessionStatusResponse>,
  { appointmentId: string; request: RescheduleSessionRequest },
  { rejectValue: SessionThunkError }
>('sessions/rescheduleSession', async ({ appointmentId, request }, { rejectWithValue }) => {
  try {
    const response = await sessionService.rescheduleSession(appointmentId, request);

    if (!response.success) {
      return rejectWithValue({
        message: response.message ?? 'Failed to reschedule session',
      });
    }

    return response;
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });
  }
});

/**
 * CANCEL SESSION THUNK
 * Cancels a session
 * Automatically tracks late cancellations (within 24 hours)
 */
export const cancelSession = createAsyncThunk<
  ApiResponse<SessionStatusResponse>,
  { appointmentId: string; reason?: string },
  { rejectValue: SessionThunkError }
>('sessions/cancelSession', async ({ appointmentId, reason }, { rejectWithValue }) => {
  try {
    const response = await sessionService.cancelSession(appointmentId, reason);

    if (!response.success) {
      return rejectWithValue({
        message: response.message ?? 'Failed to cancel session',
      });
    }

    return response;
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });
  }
});

/**
 * PROCESS PAYMENT THUNK
 * Processes payment for a completed session
 * Handles payment processing, retry logic, and platform fees
 */
export const processSessionPayment = createAsyncThunk<
  ApiResponse<PaymentResponse>,
  { appointmentId: string; request: ProcessSessionPaymentRequest },
  { rejectValue: SessionThunkError }
>('sessions/processPayment', async ({ appointmentId, request }, { rejectWithValue }) => {
  try {
    const response = await sessionService.processSessionPayment(appointmentId, request);

    if (!response.success) {
      return rejectWithValue({
        message: response.message ?? 'Failed to process payment',
      });
    }

    return response;
  } catch (error) {
    return rejectWithValue({
      message: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });
  }
});
