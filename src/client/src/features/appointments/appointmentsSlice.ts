// src/features/appointments/appointmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import appointmentService from '../../api/services/appointmentService';
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
  async () => {
    return await appointmentService.getAppointments();
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
    await appointmentService.respondToAppointment(appointmentId, status);
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
  async (appointmentId: string) => {
    await appointmentService.completeAppointment(appointmentId);
    // Fetch updated appointment after completion
    return await appointmentService.getAppointment(appointmentId);
  }
);

export const fetchUpcomingAppointments = createAsyncThunk(
  'appointments/fetchUpcoming',
  async (params?: { limit?: number }) => {
    return await appointmentService.getUpcomingAppointments(params?.limit);
  }
);

export const fetchPastAppointments = createAsyncThunk(
  'appointments/fetchPast',
  async (params?: { page?: number; limit?: number }) => {
    return await appointmentService.getPastAppointments(params);
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'appointments/fetchAvailableSlots',
  async ({ userId, date }: { userId: string; date: string }) => {
    return await appointmentService.getAvailableSlots(userId, date);
  }
);

export const updateAppointmentDetails = createAsyncThunk(
  'appointments/updateDetails',
  async ({ appointmentId, updates }: { appointmentId: string; updates: Partial<Appointment> }) => {
    return await appointmentService.updateAppointment(appointmentId, updates);
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointments/reschedule',
  async ({ appointmentId, newDateTime, reason }: { appointmentId: string; newDateTime: string; reason?: string }) => {
    return await appointmentService.rescheduleAppointment(appointmentId, newDateTime, reason);
  }
);

export const rateAppointment = createAsyncThunk(
  'appointments/rate',
  async ({ appointmentId, rating, feedback }: { appointmentId: string; rating: number; feedback?: string }) => {
    return await appointmentService.rateAppointment(appointmentId, rating, feedback);
  }
);

export const reportAppointment = createAsyncThunk(
  'appointments/report',
  async ({ appointmentId, reason, description }: { appointmentId: string; reason: string; description: string }) => {
    await appointmentService.reportAppointment(appointmentId, reason, description);
    return appointmentId;
  }
);

export const getAppointmentStatistics = createAsyncThunk(
  'appointments/getStatistics',
  async (timeRange?: string) => {
    return await appointmentService.getAppointmentStatistics(timeRange);
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
        state.appointments = action.payload;
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
      .addCase(completeAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        updateAppointmentInList(state, action.payload);
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
      .addCase(updateAppointmentDetails.fulfilled, (state, action) => {
        state.activeAppointment = action.payload;
        updateAppointmentInList(state, action.payload);
      })
      
      // Reschedule Appointment
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        state.activeAppointment = action.payload;
        updateAppointmentInList(state, action.payload);
      })
      
      // Rate Appointment
      .addCase(rateAppointment.fulfilled, (state, action) => {
        state.activeAppointment = action.payload;
        updateAppointmentInList(state, action.payload);
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