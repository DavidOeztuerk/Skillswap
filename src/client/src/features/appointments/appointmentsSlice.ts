// src/features/appointments/appointmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import appointmentService, { GetUserAppointmentsRequest } from '../../api/services/appointmentService';
import { AppointmentsState } from '../../types/states/AppointmentsState';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { SliceError } from '../../store/types';

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
    // Transform backend response to frontend format
    return {
      appointments: response.Data.map(item => ({
        id: item.AppointmentId,
        teacherId: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId,
        teacherDetails: { id: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId, name: item.OtherPartyName } as any,
        studentId: item.IsOrganizer ? item.OtherPartyUserId : 'current-user',
        studentDetails: { id: item.IsOrganizer ? item.OtherPartyUserId : 'current-user', name: item.OtherPartyName } as any,
        skillId: 'unknown-skill', // Not provided by backend
        skill: { id: 'unknown-skill', name: 'Unknown Skill' } as any,
        startTime: item.ScheduledDate.toString(),
        endTime: new Date(new Date(item.ScheduledDate).getTime() + item.DurationMinutes * 60000).toISOString(),
        status: item.Status as AppointmentStatus,
        notes: item.Location || '',
        videocallUrl: item.MeetingType === 'VideoCall' ? `/call/${item.AppointmentId}` : undefined,
        createdAt: new Date().toISOString(),
      })),
      pagination: {
        page: response.PageNumber,
        limit: response.PageSize,
        total: response.TotalCount,
        totalPages: response.TotalPages,
      }
    };
  }
);

export const fetchAppointment = createAsyncThunk(
  'appointments/fetchAppointment',
  async (appointmentId: string) => {
    return await appointmentService.getAppointment(appointmentId);
  }
);

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: AppointmentRequest) => {
    return await appointmentService.createAppointment(appointmentData);
  }
);

export const respondToAppointment = createAsyncThunk(
  'appointments/respondToAppointment',
  async ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) => {
    if (status === 'Confirmed') {
      await appointmentService.acceptAppointment(appointmentId);
    } else {
      await appointmentService.cancelAppointment(appointmentId);
    }
    // Fetch updated appointment after response
    return await appointmentService.getAppointment(appointmentId);
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (appointmentId: string) => {
    await appointmentService.cancelAppointment(appointmentId);
    // Fetch updated appointment after cancellation
    return await appointmentService.getAppointment(appointmentId);
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
    // Transform backend response to frontend format
    return response.Data.map(item => ({
      id: item.AppointmentId,
      teacherId: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId,
      teacherDetails: { id: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId, name: item.OtherPartyName } as any,
      studentId: item.IsOrganizer ? item.OtherPartyUserId : 'current-user',
      studentDetails: { id: item.IsOrganizer ? item.OtherPartyUserId : 'current-user', name: item.OtherPartyName } as any,
      skillId: 'unknown-skill',
      skill: { id: 'unknown-skill', name: 'Unknown Skill' } as any,
      startTime: item.ScheduledDate.toString(),
      endTime: new Date(new Date(item.ScheduledDate).getTime() + item.DurationMinutes * 60000).toISOString(),
      status: item.Status as AppointmentStatus,
      notes: item.Location || '',
      videocallUrl: item.MeetingType === 'VideoCall' ? `/call/${item.AppointmentId}` : undefined,
      createdAt: new Date().toISOString(),
    }));
  }
);

export const fetchPastAppointments = createAsyncThunk(
  'appointments/fetchPast',
  async (params?: { page?: number; limit?: number }) => {
    const response = await appointmentService.getPastAppointments(params);
    return {
      data: response.Data.map(item => ({
        id: item.AppointmentId,
        teacherId: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId,
        teacherDetails: { id: item.IsOrganizer ? 'current-user' : item.OtherPartyUserId, name: item.OtherPartyName } as any,
        studentId: item.IsOrganizer ? item.OtherPartyUserId : 'current-user',
        studentDetails: { id: item.IsOrganizer ? item.OtherPartyUserId : 'current-user', name: item.OtherPartyName } as any,
        skillId: 'unknown-skill',
        skill: { id: 'unknown-skill', name: 'Unknown Skill' } as any,
        startTime: item.ScheduledDate.toString(),
        endTime: new Date(new Date(item.ScheduledDate).getTime() + item.DurationMinutes * 60000).toISOString(),
        status: item.Status as AppointmentStatus,
        notes: item.Location || '',
        videocallUrl: item.MeetingType === 'VideoCall' ? `/call/${item.AppointmentId}` : undefined,
        createdAt: new Date().toISOString(),
      })),
      page: response.PageNumber,
      limit: response.PageSize,
      total: response.TotalCount,
      totalPages: response.TotalPages,
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
  async (_: { appointmentId: string; newDateTime: string; reason?: string }) => {
    // This endpoint doesn't exist in backend
    console.warn('rescheduleAppointment: Backend endpoint not implemented');
    throw new Error('Reschedule appointment endpoint not implemented');
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
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.error = { message: action.error.message || 'Reschedule appointment failed' } as SliceError;
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
} = appointmentsSlice.actions;
export default appointmentsSlice.reducer;