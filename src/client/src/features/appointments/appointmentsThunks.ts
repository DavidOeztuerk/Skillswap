import appointmentService, { GetUserAppointmentsRequest, UserAppointmentResponse } from "../../api/services/appointmentService";
import { createAppAsyncThunk } from "../../store/thunkHelpers";
import { PagedSuccessResponse, isPagedResponse, SuccessResponse, isSuccessResponse } from "../../types/api/UnifiedResponse";
import { AppointmentRequest } from "../../types/contracts/requests/AppointmentRequest";
import { RescheduleAppointmentResponse } from "../../types/contracts/responses/RescheduleAppointmentResponse";
import { Appointment, AppointmentStatus } from "../../types/models/Appointment";

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
const mapUserAppointmentToAppointment = (userApp: UserAppointmentResponse, currentUserId?: string): Appointment => {
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
    // matchId, skillId, description, meetingLink: Nur in Detail-Endpoint verfügbar

    // KORREKTE Mapping-Logik:
    // isOrganizer=true  → Ich bin Organizer, andere Person ist Participant
    // isOrganizer=false → Ich bin Participant, andere Person ist Organizer
    organizerUserId: userApp.isOrganizer ? (currentUserId || '') : userApp.otherPartyUserId,
    participantUserId: userApp.isOrganizer ? userApp.otherPartyUserId : (currentUserId || ''),

    scheduledDate: userApp.scheduledDate, // ISO string vom Backend
    startTime: startDate.toISOString(),
    // EndTime muss berechnet werden - Backend gibt es nicht zurück
    endTime: new Date(startDate.getTime() + (userApp.durationMinutes || 60) * 60000).toISOString(),
    durationMinutes: userApp.durationMinutes || 60,
    status: userApp.status as AppointmentStatus,
    meetingType: userApp.meetingType || 'VideoCall',
    createdAt: startDate.toISOString(), // Fallback auf scheduledDate
    updatedAt: startDate.toISOString(), // Fallback auf scheduledDate
  };
};

// ==================== FETCH OPERATIONS ====================

export const fetchAppointments = createAppAsyncThunk<PagedSuccessResponse<Appointment>, GetUserAppointmentsRequest>(
  'appointments/fetchAppointments',
  async (request: GetUserAppointmentsRequest = {}, { rejectWithValue, getState }) => {
    try {
      const response = await appointmentService.getAppointments(request);

      if (!isPagedResponse(response)) {
        return rejectWithValue(response);
      }

      // Get current user ID from state
      const state = getState();
      const currentUserId = state.auth.user?.id;

      // Transform UserAppointmentResponse[] to Appointment[]
      const transformedData = response.data.map(item => mapUserAppointmentToAppointment(item, currentUserId));

      return {
        ...response,
        data: transformedData,
      } as PagedSuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ fetchAppointments error:', error);
      // Return serializable error object for Redux
      return rejectWithValue({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch appointments',
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }
  }
);

export const fetchAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, string>(
  'appointments/fetchAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointment(appointmentId);
      // Detail endpoint returns full Appointment object with all fields
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ fetchAppointment error:', error);
      return rejectWithValue(error as any);
    }
  }
);

export const fetchUpcomingAppointments = createAppAsyncThunk<PagedSuccessResponse<Appointment>, { limit?: number }>(
  'appointments/fetchUpcoming',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const response = await appointmentService.getUpcomingAppointments(params?.limit);

      if (!isPagedResponse(response)) {
        return rejectWithValue(response);
      }

      const state = getState();
      const currentUserId = state.auth.user?.id;

      const transformedData = response.data.map(item => mapUserAppointmentToAppointment(item, currentUserId));

      return {
        ...response,
        data: transformedData,
      } as PagedSuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ fetchUpcomingAppointments error:', error);
      return rejectWithValue(error as any);
    }
  }
);

export const fetchPastAppointments = createAppAsyncThunk<PagedSuccessResponse<Appointment>, { page?: number; limit?: number }>(
  'appointments/fetchPast',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const response = await appointmentService.getPastAppointments(params);

      if (!isPagedResponse(response)) {
        return rejectWithValue(response);
      }

      const state = getState();
      const currentUserId = state.auth.user?.id;

      const transformedData = response.data.map(item => mapUserAppointmentToAppointment(item, currentUserId));

      return {
        ...response,
        data: transformedData,
      } as PagedSuccessResponse<Appointment>;
    } catch (error) {
      console.error('❌ fetchPastAppointments error:', error);
      return rejectWithValue(error as any);
    }
  }
);

// ==================== CRUD OPERATIONS ====================

export const createAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, AppointmentRequest>(
  'appointments/createAppointment',
  async (appointmentData: AppointmentRequest, { rejectWithValue }) => {
    try {
      const response = await appointmentService.createAppointment(appointmentData);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ createAppointment error:', error);
      return rejectWithValue(error as any);
    }
  }
);

export const respondToAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, { appointmentId: string; status: AppointmentStatus }>(
  'appointments/respondToAppointment',
  async ({ appointmentId, status }, { rejectWithValue }) => {
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
      return isSuccessResponse(appointmentResponse) ? appointmentResponse : rejectWithValue(appointmentResponse);
    } catch (error) {
      console.error('❌ respondToAppointment error:', error);
      return rejectWithValue(error as any);
    }
  }
);

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
      return isSuccessResponse(appointmentResponse) ? appointmentResponse : rejectWithValue(appointmentResponse);
    } catch (error) {
      console.error('❌ cancelAppointment error:', error);
      return rejectWithValue(error as any);
    }
  }
);

export const completeAppointment = createAppAsyncThunk<SuccessResponse<any>, string>(
  'appointments/completeAppointment',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await appointmentService.completeAppointment(appointmentId);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ completeAppointment error:', error);
      return rejectWithValue(error as any);
    }
  }
);

// ==================== APPOINTMENT ACTIONS ====================

export const rescheduleAppointment = createAppAsyncThunk<SuccessResponse<RescheduleAppointmentResponse>, {
    appointmentId: string;
    newDateTime: string;
    newDurationMinutes?: number;
    reason?: string
  }>(
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
      return rejectWithValue(error as any);
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
      return rejectWithValue(error as any);
    }
  }
);

export const rateAppointment = createAppAsyncThunk<SuccessResponse<any>, { appointmentId: string; rating: number; feedback?: string }>(
  'appointments/rate',
  async ({ appointmentId, rating, feedback }, { rejectWithValue }) => {
    try {
      await appointmentService.rateAppointment(appointmentId, rating, feedback);
      return {
        success: true,
        data: { appointmentId, rating, feedback },
        message: 'Appointment rated successfully'
      } as SuccessResponse<any>;
    } catch (error) {
      console.error('❌ rateAppointment error:', error);
      return rejectWithValue(error as any);
    }
  }
);

// ==================== UTILITY OPERATIONS ====================

export const fetchAvailableSlots = createAppAsyncThunk<SuccessResponse<any[]>, { userId: string; date: string }>(
  'appointments/fetchAvailableSlots',
  async (_params, { rejectWithValue }) => {
    try {
      console.warn('⚠️ fetchAvailableSlots: Backend endpoint not implemented');
      return {
        success: true,
        data: [],
        message: 'Slots endpoint not implemented'
      } as SuccessResponse<any[]>;
    } catch (error) {
      console.error('❌ fetchAvailableSlots error:', error);
      return rejectWithValue(error as any);
    }
  }
);

export const updateAppointmentDetails = createAppAsyncThunk<SuccessResponse<any>, { appointmentId: string; updates: Partial<Appointment> }>(
  'appointments/updateDetails',
  async (_params, { rejectWithValue }) => {
    try {
      console.warn('⚠️ updateAppointmentDetails: Backend endpoint not implemented');
      return rejectWithValue({
        success: false,
        errors: ['Update appointment endpoint not implemented'],
        message: 'Not implemented'
      });
    } catch (error) {
      console.error('❌ updateAppointmentDetails error:', error);
      return rejectWithValue(error as any);
    }
  }
);

export const reportAppointment = createAppAsyncThunk<SuccessResponse<any>, { appointmentId: string; reason: string; description: string }>(
  'appointments/report',
  async (_params, { rejectWithValue }) => {
    try {
      console.warn('⚠️ reportAppointment: Backend endpoint not implemented');
      return rejectWithValue({
        success: false,
        errors: ['Report appointment endpoint not implemented'],
        message: 'Not implemented'
      });
    } catch (error) {
      console.error('❌ reportAppointment error:', error);
      return rejectWithValue(error as any);
    }
  }
);

export const getAppointmentStatistics = createAppAsyncThunk<SuccessResponse<any>, string>(
  'appointments/getStatistics',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointmentStatistics(userId);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ getAppointmentStatistics error:', error);
      return rejectWithValue(error as any);
    }
  }
);
