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
  isLoading: false,
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
      });
  },
});

export const { clearError, setActiveAppointment } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;