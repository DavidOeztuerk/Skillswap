// src/features/appointments/appointmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import appointmentService, { GetUserAppointmentsRequest } from '../../api/services/appointmentService';
import { AppointmentsState } from '../../types/states/AppointmentsState';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { SliceError } from '../../store/types';
import { withDefault } from '../../utils/safeAccess';

const initialState: AppointmentsState = {
  appointments: [],
  activeAppointment: undefined,
  upcomingAppointments: [],
  pastAppointments: [],
  availableSlots: [],
  filters: {
    status: 'all',
    dateRange: null,
    type: 'all',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingSlots: false,
  error: null,
};

// Async thunks
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (request?: GetUserAppointmentsRequest) => {
    const response = await appointmentService.getAppointments(request || {});
    // PagedResponse has data at root level
    return {
      appointments: response?.data.map(item => {
        const scheduledDate = new Date(item.ScheduledDate);
        const endDate = new Date(scheduledDate.getTime() + withDefault(item.DurationMinutes, 60) * 60000);
        return {
          id: item.AppointmentId,
          title: item.Title,
          organizerUserId: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId,
          participantUserId: item.IsOrganizer ? item.OtherPartyUserId : 'current-user',
          skillId: 'unknown-skill', // Not provided by backend
          scheduledDate: scheduledDate.toISOString(),
          startTime: scheduledDate.toISOString(),
          endTime: endDate.toISOString(),
          durationMinutes: withDefault(item.DurationMinutes, 60),
          status: item.Status as AppointmentStatus,
          meetingType: item.MeetingType,
          createdAt: new Date().toISOString(),
        };
      }),
      pagination: {
        page: withDefault(response?.pageNumber, 1),
        limit: withDefault(response?.pageSize, 10),
        total: withDefault(response?.totalRecords, 0),
        totalPages: withDefault(response?.totalPages, 0),
      }
    };
  }
);

export const fetchAppointment = createAsyncThunk(
  'appointments/fetchAppointment',
  async (appointmentId: string) => {
    const response = await appointmentService.getAppointment(appointmentId);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch appointment');
    }
    return response.data;
  }
);

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: AppointmentRequest) => {
    const response = await appointmentService.createAppointment(appointmentData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create appointment');
    }
    return response.data;
  }
);

export const respondToAppointment = createAsyncThunk(
  'appointments/respondToAppointment',
  async ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) => {
    let response;
    if (status === 'Confirmed') {
      response = await appointmentService.acceptAppointment(appointmentId);
    } else {
      response = await appointmentService.cancelAppointment(appointmentId);
    }
    if (!response.success) {
      throw new Error(response.message || 'Failed to respond to appointment');
    }
    // Fetch updated appointment after response
    const appointmentResponse = await appointmentService.getAppointment(appointmentId);
    if (!appointmentResponse.success || !appointmentResponse.data) {
      throw new Error(appointmentResponse.message || 'Failed to fetch updated appointment');
    }
    return appointmentResponse.data;
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (appointmentId: string) => {
    const response = await appointmentService.cancelAppointment(appointmentId);
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel appointment');
    }
    // Fetch updated appointment after cancellation
    const appointmentResponse = await appointmentService.getAppointment(appointmentId);
    if (!appointmentResponse.success || !appointmentResponse.data) {
      throw new Error(appointmentResponse.message || 'Failed to fetch updated appointment');
    }
    return appointmentResponse.data;
  }
);

export const completeAppointment = createAsyncThunk(
  'appointments/completeAppointment',
  async (_: string) => {
    // This endpoint doesn't exist in backend
    console.warn('completeAppointment: Backend endpoint not implemented');
    throw new Error('Complete appointment endpoint not implemented');
  }
);

export const fetchUpcomingAppointments = createAsyncThunk(
  'appointments/fetchUpcoming',
  async (params?: { limit?: number }) => {
    const response = await appointmentService.getUpcomingAppointments(params?.limit);
    // PagedResponse has data at root level
    return response?.data?.map(item => {
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
    });
  }
);

export const fetchPastAppointments = createAsyncThunk(
  'appointments/fetchPast',
  async (params?: { page?: number; limit?: number }) => {
    const response = await appointmentService.getPastAppointments(params);
    return {
      data: response?.data?.map(item => {
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
      }),
      page: withDefault(response?.pageNumber, 1),
      limit: withDefault(response?.pageSize, 10),
      total: withDefault(response?.totalRecords, 0),
      totalPages: withDefault(response?.totalPages, 0),
    };
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'appointments/fetchAvailableSlots',
  async (_: { userId: string; date: string }) => {
    // This endpoint doesn't exist in backend - return empty array
    console.warn('fetchAvailableSlots: Backend endpoint not implemented');
    return [];
  }
);

export const updateAppointmentDetails = createAsyncThunk(
  'appointments/updateDetails',
  async (_: { appointmentId: string; updates: Partial<Appointment> }) => {
    // This endpoint doesn't exist in backend
    console.warn('updateAppointmentDetails: Backend endpoint not implemented');
    throw new Error('Update appointment endpoint not implemented');
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointments/reschedule',
  async ({ appointmentId, newDateTime, newDurationMinutes, reason }: { 
    appointmentId: string; 
    newDateTime: string; 
    newDurationMinutes?: number;
    reason?: string 
  }) => {
    const response = await appointmentService.rescheduleAppointment(
      appointmentId, 
      newDateTime,
      newDurationMinutes,
      reason
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to reschedule appointment');
    }
    
    // Fetch updated appointment after rescheduling
    const appointmentResponse = await appointmentService.getAppointment(appointmentId);
    if (!appointmentResponse.success || !appointmentResponse.data) {
      throw new Error(appointmentResponse.message || 'Failed to fetch updated appointment');
    }
    
    return appointmentResponse.data;
  }
);

export const generateMeetingLink = createAsyncThunk(
  'appointments/generateMeetingLink',
  async (appointmentId: string) => {
    const response = await appointmentService.generateMeetingLink(appointmentId);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to generate meeting link');
    }
    
    return { appointmentId, meetingLink: response.data };
  }
);

export const rateAppointment = createAsyncThunk(
  'appointments/rate',
  async (_: { appointmentId: string; rating: number; feedback?: string }) => {
    // This endpoint doesn't exist in backend
    console.warn('rateAppointment: Backend endpoint not implemented');
    throw new Error('Rate appointment endpoint not implemented');
  }
);

export const reportAppointment = createAsyncThunk(
  'appointments/report',
  async (_: { appointmentId: string; reason: string; description: string }) => {
    // This endpoint doesn't exist in backend
    console.warn('reportAppointment: Backend endpoint not implemented');
    throw new Error('Report appointment endpoint not implemented');
  }
);

export const getAppointmentStatistics = createAsyncThunk(
  'appointments/getStatistics',
  async (_?: string) => {
    // This endpoint doesn't exist in backend
    console.warn('getAppointmentStatistics: Backend endpoint not implemented');
    throw new Error('Appointment statistics endpoint not implemented');
  }
);

// Slice
const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveAppointment: (state, action: PayloadAction<Appointment | undefined>) => {
      state.activeAppointment = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AppointmentsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<AppointmentsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateAppointmentInList: (state, action: PayloadAction<Appointment>) => {
      const index = state.appointments.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
    },
    removeAppointmentFromList: (state, action: PayloadAction<string>) => {
      state.appointments = state.appointments.filter(a => a.id !== action.payload);
      state.upcomingAppointments = state.upcomingAppointments.filter(a => a.id !== action.payload);
      state.pastAppointments = state.pastAppointments.filter(a => a.id !== action.payload);
    },
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
    },
    
    // Optimistic updates
    updateAppointmentStatusOptimistic: (state, action: PayloadAction<{ appointmentId: string; status: AppointmentStatus }>) => {
      const { appointmentId, status } = action.payload;
      
      // Update in all lists
      const updateInList = (list: Appointment[]) => {
        const appointment = list.find(a => a.id === appointmentId);
        if (appointment) {
          appointment.status = status;
        }
      };
      
      updateInList(state.appointments);
      updateInList(state.upcomingAppointments);
      updateInList(state.pastAppointments);
      
      // Update active appointment if it matches
      if (state.activeAppointment?.id === appointmentId) {
        state.activeAppointment.status = status;
      }
    },
    
    // Rollback actions
    setAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.appointments = action.payload;
    },
    
    setUpcomingAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.upcomingAppointments = action.payload;
    },
    
    setPastAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.pastAppointments = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Helper function to update appointment in list
    const updateAppointmentInList = (state: AppointmentsState, appointment: Appointment) => {
      const index = state.appointments.findIndex(a => a.id === appointment.id);
      if (index !== -1) {
        state.appointments[index] = appointment;
      }
    };

    builder
      // Fetch Appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload.appointments;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError
      })
      
      // Fetch Single Appointment
      .addCase(fetchAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        updateAppointmentInList(state, action.payload);
      })
      .addCase(fetchAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError
      })
      
      // Create Appointment
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments.push(action.payload);
        state.activeAppointment = action.payload;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError
      })
      
      // Respond To Appointment
      .addCase(respondToAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(respondToAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        updateAppointmentInList(state, action.payload);
      })
      .addCase(respondToAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError
      })
      
      // Cancel Appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        updateAppointmentInList(state, action.payload);
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError
      })
      
      // Complete Appointment
      .addCase(completeAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError
      })
      
      // Fetch Upcoming Appointments
      .addCase(fetchUpcomingAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.upcomingAppointments = action.payload;
      })
      .addCase(fetchUpcomingAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })
      
      // Fetch Past Appointments
      .addCase(fetchPastAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPastAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pastAppointments = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchPastAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })
      
      // Fetch Available Slots
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoadingSlots = true;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoadingSlots = false;
        state.availableSlots = action.payload;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoadingSlots = false;
        state.error = action.error as SliceError;
      })
      
      // Update Appointment Details
      .addCase(updateAppointmentDetails.rejected, (state, action) => {
        state.error = { message: action.error.message || 'Update appointment failed' } as SliceError;
      })
      
      // Reschedule Appointment
      .addCase(rescheduleAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the appointment in the list
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        // Update active appointment if it's the same
        if (state.activeAppointment?.id === action.payload.id) {
          state.activeAppointment = action.payload;
        }
        // Update in upcoming appointments
        const upcomingIndex = state.upcomingAppointments.findIndex(a => a.id === action.payload.id);
        if (upcomingIndex !== -1) {
          state.upcomingAppointments[upcomingIndex] = action.payload;
        }
      })
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = { message: action.error.message || 'Reschedule appointment failed' } as SliceError;
      })
      
      // Generate Meeting Link
      .addCase(generateMeetingLink.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateMeetingLink.fulfilled, (state, action) => {
        state.isLoading = false;
        const { appointmentId, meetingLink } = action.payload;
        
        // Update the appointment in all lists
        const updateAppointment = (appointment: Appointment) => {
          if (appointment.id === appointmentId) {
            appointment.meetingLink = meetingLink;
          }
        };
        
        state.appointments.forEach(updateAppointment);
        state.upcomingAppointments.forEach(updateAppointment);
        
        if (state.activeAppointment?.id === appointmentId) {
          state.activeAppointment.meetingLink = meetingLink;
        }
      })
      .addCase(generateMeetingLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = { message: action.error.message || 'Failed to generate meeting link' } as SliceError;
      })
      
      // Rate Appointment
      .addCase(rateAppointment.rejected, (state, action) => {
        state.error = { message: action.error.message || 'Rate appointment failed' } as SliceError;
      })
      
      // Report Appointment
      .addCase(reportAppointment.rejected, (state, action) => {
        state.error = { message: action.error.message || 'Report appointment failed' } as SliceError;
      })
      
      // // Complete Appointment
      // .addCase(completeAppointment.rejected, (state, action) => {
      //   state.error = { message: action.error.message || 'Complete appointment failed' } as SliceError;
      // })
      
      // Get Statistics
      .addCase(getAppointmentStatistics.rejected, (state, action) => {
        state.error = { message: action.error.message || 'Get statistics failed' } as SliceError;
      });
  },
});

export const {
  clearError,
  setActiveAppointment,
  setFilters,
  setPagination,
  updateAppointmentInList,
  removeAppointmentFromList,
  clearAvailableSlots,
  updateAppointmentStatusOptimistic,
  setAppointments,
  setUpcomingAppointments,
  setPastAppointments,
} = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
