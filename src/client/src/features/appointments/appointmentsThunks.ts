import appointmentService, { GetUserAppointmentsRequest } from "../../api/services/appointmentService";
import { createAppAsyncThunk } from "../../store/thunkHelpers";
import { PagedSuccessResponse, isPagedResponse, SuccessResponse, isSuccessResponse } from "../../types/api/UnifiedResponse";
import { AppointmentRequest } from "../../types/contracts/requests/AppointmentRequest";
import { RescheduleAppointmentResponse } from "../../types/contracts/responses/RescheduleAppointmentResponse";
import { Appointment, AppointmentStatus } from "../../types/models/Appointment";
import { withDefault } from "../../utils/safeAccess";

export const fetchAppointments = createAppAsyncThunk<PagedSuccessResponse<Appointment>, GetUserAppointmentsRequest>(
  'appointments/fetchAppointments',
  async (request: GetUserAppointmentsRequest = {}, { rejectWithValue }) => {
    const response = await appointmentService.getAppointments(request);
    if (isPagedResponse(response)) {
      // Transform UserAppointmentResponse to Appointment
      const transformedData = response.data?.map(item => {
        const scheduledDate = new Date(item.ScheduledDate);
        const endDate = new Date(scheduledDate.getTime() + withDefault(item.DurationMinutes, 60) * 60000);
        return {
          id: item.AppointmentId,
          title: item.Title,
          organizerUserId: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId,
          participantUserId: item.IsOrganizer ? item.OtherPartyUserId : 'current-user',
          skillId: 'unknown-skill',
          scheduledDate: scheduledDate.toISOString(),
          startTime: scheduledDate.toISOString(),
          endTime: endDate.toISOString(),
          durationMinutes: withDefault(item.DurationMinutes, 60),
          status: item.Status as AppointmentStatus,
          meetingType: item.MeetingType,
          createdAt: new Date().toISOString(),
        };
      }) || [];
      return { ...response, data: transformedData };
    }
    return rejectWithValue(response);
  }
);

export const fetchAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, string>(
  'appointments/fetchAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    const response = await appointmentService.getAppointment(appointmentId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const createAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, AppointmentRequest>(
  'appointments/createAppointment',
  async (appointmentData: AppointmentRequest, { rejectWithValue }) => {
    const response = await appointmentService.createAppointment(appointmentData);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const respondToAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, { appointmentId: string; status: AppointmentStatus }>(
  'appointments/respondToAppointment',
  async ({ appointmentId, status }, { rejectWithValue }) => {
    let response;
    if (status === 'Confirmed') {
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
  }
);

export const cancelAppointment = createAppAsyncThunk<SuccessResponse<Appointment>, string>(
  'appointments/cancelAppointment',
  async (appointmentId, { rejectWithValue }) => {
    const response = await appointmentService.cancelAppointment(appointmentId);
    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }
    // Fetch updated appointment after cancellation
    const appointmentResponse = await appointmentService.getAppointment(appointmentId);
    return isSuccessResponse(appointmentResponse) ? appointmentResponse : rejectWithValue(appointmentResponse);
  }
);

export const completeAppointment = createAppAsyncThunk<SuccessResponse<any>, string>(
  'appointments/completeAppointment',
  async (_, { rejectWithValue }) => {
    // This endpoint doesn't exist in backend
    console.warn('completeAppointment: Backend endpoint not implemented');
    return rejectWithValue({ success: false, errors: ['Complete appointment endpoint not implemented'], message: 'Complete appointment endpoint not implemented' });
  }
);

export const fetchUpcomingAppointments = createAppAsyncThunk<PagedSuccessResponse<Appointment>, { limit?: number }>(
  'appointments/fetchUpcoming',
  async (params = {}, { rejectWithValue }) => {
    const response = await appointmentService.getUpcomingAppointments(params?.limit);
    if (isPagedResponse(response)) {
      const transformedData = response.data?.map(item => {
        const scheduledDate = new Date(item.ScheduledDate);
        const endDate = new Date(scheduledDate.getTime() + withDefault(item.DurationMinutes, 60) * 60000);
        return {
          id: item.AppointmentId,
          title: item.Title,
          organizerUserId: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId,
          participantUserId: item.IsOrganizer ? item.OtherPartyUserId : 'current-user',
          skillId: 'unknown-skill',
          scheduledDate: scheduledDate.toISOString(),
          startTime: scheduledDate.toISOString(),
          endTime: endDate.toISOString(),
          durationMinutes: withDefault(item.DurationMinutes, 60),
          status: item.Status as AppointmentStatus,
          meetingType: item.MeetingType,
          createdAt: new Date().toISOString(),
        };
      }) || [];
      return { ...response, data: transformedData };
    }
    return rejectWithValue(response);
  }
);

export const fetchPastAppointments = createAppAsyncThunk<PagedSuccessResponse<Appointment>, { page?: number; limit?: number }>(
  'appointments/fetchPast',
  async (params = {}, { rejectWithValue }) => {
    const response = await appointmentService.getPastAppointments(params);
    if (isPagedResponse(response)) {
      const transformedData = response.data?.map(item => {
        const scheduledDate = new Date(item.ScheduledDate);
        const endDate = new Date(scheduledDate.getTime() + withDefault(item.DurationMinutes, 60) * 60000);
        return {
          id: item.AppointmentId,
          title: item.Title,
          organizerUserId: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId,
          participantUserId: item.IsOrganizer ? item.OtherPartyUserId : 'current-user',
          skillId: 'unknown-skill',
          scheduledDate: scheduledDate.toISOString(),
          startTime: scheduledDate.toISOString(),
          endTime: endDate.toISOString(),
          durationMinutes: withDefault(item.DurationMinutes, 60),
          status: item.Status as AppointmentStatus,
          meetingType: item.MeetingType,
          createdAt: new Date().toISOString(),
        };
      }) || [];
      return { ...response, data: transformedData };
    }
    return rejectWithValue(response);
  }
);

export const fetchAvailableSlots = createAppAsyncThunk<SuccessResponse<any[]>, { userId: string; date: string }>(
  'appointments/fetchAvailableSlots',
  async (_, {}) => {
    // This endpoint doesn't exist in backend - return empty array
    console.warn('fetchAvailableSlots: Backend endpoint not implemented');
    return { success: true, data: [], message: 'Slots not implemented' };
  }
);

export const updateAppointmentDetails = createAppAsyncThunk<SuccessResponse<any>, { appointmentId: string; updates: Partial<Appointment> }>(
  'appointments/updateDetails',
  async (_, { rejectWithValue }) => {
    // This endpoint doesn't exist in backend
    console.warn('updateAppointmentDetails: Backend endpoint not implemented');
    return rejectWithValue({ success: false, errors: [], message: 'Update appointment endpoint not implemented' });
  }
);

export const rescheduleAppointment = createAppAsyncThunk<SuccessResponse<RescheduleAppointmentResponse>, { 
    appointmentId: string; 
    newDateTime: string; 
    newDurationMinutes?: number;
    reason?: string 
  }>(
  'appointments/reschedule',
  async ({ appointmentId, newDateTime, newDurationMinutes, reason }, { rejectWithValue }) => {
    const response = await appointmentService.rescheduleAppointment(
      appointmentId, 
      newDateTime,
      newDurationMinutes,
      reason
    );
    
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const generateMeetingLink = createAppAsyncThunk<SuccessResponse<string>, string>(
  'appointments/generateMeetingLink',
  async (appointmentId: string, { rejectWithValue }) => {
    const response = await appointmentService.generateMeetingLink(appointmentId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const rateAppointment = createAppAsyncThunk<SuccessResponse<any>, { appointmentId: string; rating: number; feedback?: string }>(
  'appointments/rate',
  async (_, { rejectWithValue }) => {
    // This endpoint doesn't exist in backend
    console.warn('rateAppointment: Backend endpoint not implemented');
    return rejectWithValue({ success: false, errors: [], message: 'Rate appointment endpoint not implemented' });
  }
);

export const reportAppointment = createAppAsyncThunk<SuccessResponse<any>, { appointmentId: string; reason: string; description: string }>(
  'appointments/report',
  async (_, { rejectWithValue }) => {
    // This endpoint doesn't exist in backend
    console.warn('reportAppointment: Backend endpoint not implemented');
    return rejectWithValue({ success: false, errors: [], message: 'Report appointment endpoint not implemented' });
  }
);

export const getAppointmentStatistics = createAppAsyncThunk<SuccessResponse<any>, string>(
  'appointments/getStatistics',
  async (_, { rejectWithValue }) => {
    // This endpoint doesn't exist in backend
    console.warn('getAppointmentStatistics: Backend endpoint not implemented');
    return rejectWithValue({ success: false, errors: [], message: 'Appointment statistics endpoint not implemented' });
  }
);