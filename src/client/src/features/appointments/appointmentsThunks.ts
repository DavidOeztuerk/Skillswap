import appointmentService, {
  type GetUserAppointmentsRequest,
  type UserAppointmentResponse,
} from '../../api/services/appointmentService';
import type { AvailableSlot } from '../../store/adapters/appointmentsAdapter+State';
import { createAppAsyncThunk } from '../../store/thunkHelpers';
import {
  type PagedSuccessResponse,
  isPagedResponse,
  type SuccessResponse,
  isSuccessResponse,
  createErrorResponse,
} from '../../types/api/UnifiedResponse';
import type { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import type { RescheduleAppointmentResponse } from '../../types/contracts/responses/RescheduleAppointmentResponse';
import { type Appointment, AppointmentStatus } from '../../types/models/Appointment';

/**
 * APPOINTMENTS THUNKS - REFACTORED & CORRECTED
 *
 * ✅ Pattern: Wie AuthThunk (simpel, minimal transformation)
 * ✅ Backend liefert UserAppointmentResponse
 * ✅ KORREKTE Logik für Organizer/Participant
 * ✅ Keine undefined variables mehr
 * ✅ Type-safe mit proper error handling
 */

// ==================== HELPER: Response Transformation ====================

/**
 * Helper to safely get a string value from backend data
 */
const getString = (data: Record<string, unknown>, key: string): string | undefined => {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
};

/**
 * Helper to safely get a number value from backend data
 */
const getNumber = (data: Record<string, unknown>, key: string): number | undefined => {
  const value = data[key];
  return typeof value === 'number' ? value : undefined;
};

/**
 * Helper to safely get a boolean value from backend data
 */
const getBoolean = (data: Record<string, unknown>, key: string): boolean | undefined => {
  const value = data[key];
  return typeof value === 'boolean' ? value : undefined;
};

/**
 * Transforms backend response (with appointmentId) to frontend Appointment model (with id)
 * Used for create/update operations that return the full appointment details
 */
const mapBackendResponseToAppointment = (backendData: Record<string, unknown>): Appointment => {
  // Backend uses appointmentId, frontend Entity Adapter expects id
  const appointmentId =
    getString(backendData, 'appointmentId') ?? getString(backendData, 'id') ?? '';

  // Parse dates safely
  const scheduledDate = getString(backendData, 'scheduledDate');
  const startDate = scheduledDate ? new Date(scheduledDate) : new Date();
  const durationMinutes = getNumber(backendData, 'durationMinutes') ?? 60;

  // Safely get status with proper type checking
  const rawStatus = getString(backendData, 'status');
  const status: AppointmentStatus =
    rawStatus !== undefined && rawStatus !== ''
      ? (rawStatus as AppointmentStatus)
      : AppointmentStatus.Pending;

  return {
    id: appointmentId,
    title: getString(backendData, 'title') ?? '',
    description: getString(backendData, 'description'),
    skillId: getString(backendData, 'skillId'),
    meetingLink: getString(backendData, 'meetingLink'),
    organizerUserId: getString(backendData, 'organizerUserId') ?? '',
    participantUserId: getString(backendData, 'participantUserId') ?? '',
    isOrganizer: true, // Creator is always the organizer
    otherPartyName: getString(backendData, 'participantName'),
    otherPartyUserId: getString(backendData, 'participantUserId'),

    // Connection-level data
    connectionId: getString(backendData, 'connectionId'),
    connectionType: getString(backendData, 'connectionType'),
    connectionStatus: getString(backendData, 'connectionStatus'),

    // Series-level data
    sessionSeriesId: getString(backendData, 'sessionSeriesId'),
    sessionSeriesTitle: getString(backendData, 'sessionSeriesTitle'),
    sessionNumber: getNumber(backendData, 'sessionNumber'),
    totalSessionsInSeries: getNumber(backendData, 'totalSessionsInSeries'),
    completedSessionsInSeries: getNumber(backendData, 'completedSessionsInSeries'),

    // Derived flags
    isSkillExchange: getBoolean(backendData, 'isSkillExchange') ?? false,
    isMonetary: getBoolean(backendData, 'isMonetary') ?? false,

    // Session-specific data
    isConfirmed: getBoolean(backendData, 'isConfirmed') ?? false,
    isPaymentCompleted: getBoolean(backendData, 'isPaymentCompleted') ?? false,
    paymentAmount: getNumber(backendData, 'paymentAmount'),
    currency: getString(backendData, 'currency'),

    // Dates and times
    scheduledDate: scheduledDate ?? startDate.toISOString(),
    startTime: startDate.toISOString(),
    endTime: new Date(startDate.getTime() + durationMinutes * 60000).toISOString(),
    durationMinutes,
    status,
    meetingType: getString(backendData, 'meetingType') ?? 'VideoCall',
    createdAt: getString(backendData, 'createdAt') ?? startDate.toISOString(),
    updatedAt: getString(backendData, 'updatedAt') ?? startDate.toISOString(),
  };
};

/**
 * Konvertiert UserAppointmentResponse vom Backend zu Appointment Model
 *
 * WICHTIG: Backend Logic verstehen!
 * - isOrganizer: true = Ich bin der Organizer, false = Ich bin der Participant
 * - otherPartyUserId: Die ANDERE Person (nicht ich!)
 *
 * BACKEND gibt NICHT zurück:
 * - MatchId, SkillId, MeetingLink, Description (nur in Detail-Endpoint)
 * - EndTime (muss berechnet werden)
 */
const mapUserAppointmentToAppointment = (
  userApp: UserAppointmentResponse,
  currentUserId?: string
): Appointment => {
  // Defensive: Parse scheduledDate with validation
  let startDate: Date;
  try {
    startDate = new Date(userApp.scheduledDate);
    // Check if date is valid
    if (isNaN(startDate.getTime())) {
      console.error('❌ Invalid scheduledDate from backend:', userApp.scheduledDate);
      startDate = new Date(); // Fallback to current date
    }
  } catch (error) {
    console.error('❌ Error parsing scheduledDate:', error, userApp);
    startDate = new Date(); // Fallback to current date
  }

  return {
    id: userApp.appointmentId,
    title: userApp.title,
    description: userApp.description,
    skillId: userApp.skillId,
    meetingLink: userApp.meetingLink,

    // KORREKTE Mapping-Logik:
    // isOrganizer=true  → Ich bin Organizer, andere Person ist Participant
    // isOrganizer=false → Ich bin Participant, andere Person ist Organizer
    organizerUserId: userApp.isOrganizer ? (currentUserId ?? '') : userApp.otherPartyUserId,
    participantUserId: userApp.isOrganizer ? userApp.otherPartyUserId : (currentUserId ?? ''),
    isOrganizer: userApp.isOrganizer,

    // Store other party name for display
    otherPartyName: userApp.otherPartyName,
    otherPartyUserId: userApp.otherPartyUserId,

    // Connection-level data (NEW MODEL)
    connectionId: userApp.connectionId,
    connectionType: userApp.connectionType,
    connectionStatus: userApp.connectionStatus,

    // Series-level data (NEW MODEL)
    sessionSeriesId: userApp.sessionSeriesId,
    sessionSeriesTitle: userApp.sessionSeriesTitle,
    sessionNumber: userApp.sessionNumber,
    totalSessionsInSeries: userApp.totalSessionsInSeries,
    completedSessionsInSeries: userApp.completedSessionsInSeries,

    // Derived flags (already calculated by backend!)
    isSkillExchange: userApp.isSkillExchange,
    isMonetary: userApp.isMonetary,

    // Session-specific data
    isConfirmed: userApp.isConfirmed,
    isPaymentCompleted: userApp.isPaymentCompleted,
    paymentAmount: userApp.paymentAmount,
    currency: userApp.currency,

    scheduledDate: userApp.scheduledDate, // ISO string vom Backend
    startTime: startDate.toISOString(),
    // EndTime muss berechnet werden - Backend gibt es nicht zurück
    endTime: new Date(startDate.getTime() + userApp.durationMinutes * 60000).toISOString(),
    durationMinutes: userApp.durationMinutes,
    status: userApp.status as AppointmentStatus,
    meetingType: userApp.meetingType || 'VideoCall',
    createdAt: startDate.toISOString(),
    updatedAt: startDate.toISOString(),
  };
};

// ==================== FETCH OPERATIONS ====================

export const fetchAppointments = createAppAsyncThunk(
  'appointments/fetchAppointments',
  async (request: GetUserAppointmentsRequest, { rejectWithValue, getState }) => {
    try {
      const response = await appointmentService.getAppointments(request);

      if (!isPagedResponse(response)) {
        return rejectWithValue(createErrorResponse(response));
      }

      // Get current user ID from state
      const state = getState();
      const currentUserId = state.auth.user?.id;

      // Transform UserAppointmentResponse[] to Appointment[]
      const transformedData = response.data.map((item) =>
        mapUserAppointmentToAppointment(item, currentUserId)
      );

      return {
        ...response,
        data: transformedData,
      } as PagedSuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ fetchAppointments error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

export const fetchAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, string>(
  'appointments/fetchAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointment(appointmentId);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      // Transform backend response (appointmentId) to frontend model (id)
      const transformedData = mapBackendResponseToAppointment(
        response.data as unknown as Record<string, unknown>
      );

      return {
        ...response,
        data: transformedData,
      } as SuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ fetchAppointment error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

export const fetchUpcomingAppointments = createAppAsyncThunk<
  PagedSuccessResponse<Appointment>,
  { limit?: number }
>('appointments/fetchUpcoming', async (params = {}, { rejectWithValue, getState }) => {
  try {
    const response = await appointmentService.getUpcomingAppointments(params.limit);

    if (!isPagedResponse(response)) {
      return rejectWithValue(createErrorResponse(response));
    }

    const state = getState();
    const currentUserId = state.auth.user?.id;

    const transformedData = response.data.map((item) =>
      mapUserAppointmentToAppointment(item, currentUserId)
    );

    return {
      ...response,
      data: transformedData,
    } as PagedSuccessResponse<Appointment>;
  } catch (error) {
    console.error('❌ fetchUpcomingAppointments error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

export const fetchPastAppointments = createAppAsyncThunk<
  PagedSuccessResponse<Appointment>,
  { page?: number; limit?: number }
>('appointments/fetchPast', async (params = {}, { rejectWithValue, getState }) => {
  try {
    const response = await appointmentService.getPastAppointments(params);

    if (!isPagedResponse(response)) {
      return rejectWithValue(createErrorResponse(response));
    }

    const state = getState();
    const currentUserId = state.auth.user?.id;

    const transformedData = response.data.map((item) =>
      mapUserAppointmentToAppointment(item, currentUserId)
    );

    return {
      ...response,
      data: transformedData,
    } as PagedSuccessResponse<Appointment>;
  } catch (error) {
    console.error('❌ fetchPastAppointments error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

// ==================== CRUD OPERATIONS ====================

export const createAppointment = createAppAsyncThunk<
  SuccessResponse<Appointment>,
  AppointmentRequest
>(
  'appointments/createAppointment',
  async (appointmentData: AppointmentRequest, { rejectWithValue }) => {
    try {
      const response = await appointmentService.createAppointment(appointmentData);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      // Transform backend response (appointmentId) to frontend model (id)
      const transformedData = mapBackendResponseToAppointment(
        response.data as unknown as Record<string, unknown>
      );

      return {
        ...response,
        data: transformedData,
      } as SuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ createAppointment THUNK error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

export const respondToAppointment = createAppAsyncThunk<
  SuccessResponse<Appointment>,
  { appointmentId: string; status: AppointmentStatus }
>('appointments/respondToAppointment', async ({ appointmentId, status }, { rejectWithValue }) => {
  try {
    let response;
    if (status === AppointmentStatus.Confirmed) {
      response = await appointmentService.acceptAppointment(appointmentId);
    } else {
      response = await appointmentService.cancelAppointment(appointmentId);
    }

    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }

    // Fetch updated appointment after response
    const appointmentResponse = await appointmentService.getAppointment(appointmentId);
    if (!isSuccessResponse(appointmentResponse)) {
      return rejectWithValue(appointmentResponse);
    }

    // Transform backend response (appointmentId) to frontend model (id)
    const transformedData = mapBackendResponseToAppointment(
      appointmentResponse.data as unknown as Record<string, unknown>
    );

    return {
      ...appointmentResponse,
      data: transformedData,
    } as SuccessResponse<Appointment>;
  } catch (error) {
    console.error('❌ respondToAppointment error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

export const cancelAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, string>(
  'appointments/cancelAppointment',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await appointmentService.cancelAppointment(appointmentId);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      // Fetch updated appointment after cancellation
      const appointmentResponse = await appointmentService.getAppointment(appointmentId);
      if (!isSuccessResponse(appointmentResponse)) {
        return rejectWithValue(appointmentResponse);
      }

      // Transform backend response (appointmentId) to frontend model (id)
      const transformedData = mapBackendResponseToAppointment(
        appointmentResponse.data as unknown as Record<string, unknown>
      );

      return {
        ...appointmentResponse,
        data: transformedData,
      } as SuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ cancelAppointment error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

export const completeAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, string>(
  'appointments/completeAppointment',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await appointmentService.completeAppointment(appointmentId);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      // Fetch updated appointment after completion
      const appointmentResponse = await appointmentService.getAppointment(appointmentId);
      if (!isSuccessResponse(appointmentResponse)) {
        return rejectWithValue(appointmentResponse);
      }

      // Transform backend response (appointmentId) to frontend model (id)
      const transformedData = mapBackendResponseToAppointment(
        appointmentResponse.data as unknown as Record<string, unknown>
      );

      return {
        ...appointmentResponse,
        data: transformedData,
      } as SuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ completeAppointment error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

// ==================== APPOINTMENT ACTIONS ====================

export const rescheduleAppointment = createAppAsyncThunk<
  SuccessResponse<RescheduleAppointmentResponse>,
  {
    appointmentId: string;
    newDateTime: string;
    newDurationMinutes?: number;
    reason?: string;
  }
>(
  'appointments/reschedule',
  async ({ appointmentId, newDateTime, newDurationMinutes, reason }, { rejectWithValue }) => {
    try {
      const response = await appointmentService.rescheduleAppointment(
        appointmentId,
        newDateTime,
        newDurationMinutes,
        reason
      );
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ rescheduleAppointment error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

export const generateMeetingLink = createAppAsyncThunk<SuccessResponse<string>, string>(
  'appointments/generateMeetingLink',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await appointmentService.generateMeetingLink(appointmentId);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ generateMeetingLink error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

export const rateAppointment = createAppAsyncThunk<
  SuccessResponse<{ appointmentId: string; rating: number; feedback?: string }>,
  { appointmentId: string; rating: number; feedback?: string }
>('appointments/rate', async ({ appointmentId, rating, feedback }, { rejectWithValue }) => {
  try {
    await appointmentService.rateAppointment(appointmentId, rating, feedback);
    return {
      success: true,
      data: { appointmentId, rating, feedback },
      message: 'Appointment rated successfully',
    } as SuccessResponse<{ appointmentId: string; rating: number; feedback?: string }>;
  } catch (error) {
    console.error('❌ rateAppointment error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

// ==================== UTILITY OPERATIONS ====================

export const fetchAvailableSlots = createAppAsyncThunk<SuccessResponse<string[]>, AvailableSlot>(
  'appointments/fetchAvailableSlots',
  (_params: AvailableSlot, { rejectWithValue }) => {
    console.warn('⚠️ fetchAvailableSlots: Backend endpoint not implemented');
    return rejectWithValue({
      success: false,
      errors: ['Slots endpoint not implemented'],
      message: 'Slots endpoint not implemented',
    });
  }
);

export const updateAppointmentDetails = createAppAsyncThunk<
  SuccessResponse<void>,
  { appointmentId: string; updates: Partial<Appointment> }
>(
  'appointments/updateDetails',
  (_params: { appointmentId: string; updates: Partial<Appointment> }, { rejectWithValue }) => {
    console.warn('⚠️ updateAppointmentDetails: Backend endpoint not implemented');
    return rejectWithValue({
      success: false,
      errors: ['Update appointment endpoint not implemented'],
      message: 'Not implemented',
    });
  }
);

export const reportAppointment = createAppAsyncThunk<
  SuccessResponse<void>,
  { appointmentId: string; reason: string; description: string }
>(
  'appointments/report',
  (
    _params: { appointmentId: string; reason: string; description: string },
    { rejectWithValue }
  ) => {
    console.warn('⚠️ reportAppointment: Backend endpoint not implemented');
    return rejectWithValue({
      success: false,
      errors: ['Report appointment endpoint not implemented'],
      message: 'Not implemented',
    });
  }
);

export const getAppointmentStatistics = createAppAsyncThunk<SuccessResponse<unknown>, string>(
  'appointments/getStatistics',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointmentStatistics(userId);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ getAppointmentStatistics error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);
