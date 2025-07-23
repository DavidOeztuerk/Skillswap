// src/features/appointments/appointmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import appointmentService from '../../api/services/appointmentService';
import { AppointmentsState } from '../../types/states/AppointmentsState';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { SliceError } from '../../store/types';

// Initial state for the appointments reducer
const initialState: AppointmentsState = {
  appointments: [],
  activeAppointment: undefined,
  isLoading: false,
  error: null,
};

// Async thunk for loading all appointments
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointments();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to load appointments'
      );
    }
  }
);

// Async thunk for loading a single appointment
export const fetchAppointment = createAsyncThunk(
  'appointments/fetchAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointment(appointmentId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to load appointment'
      );
    }
  }
);

// Async thunk for creating an appointment
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: AppointmentRequest, { rejectWithValue }) => {
    try {
      const response =
        await appointmentService.createAppointment(appointmentData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to create appointment'
      );
    }
  }
);

// Async thunk for responding to an appointment request
export const respondToAppointment = createAsyncThunk(
  'appointments/respondToAppointment',
  async (
    {
      appointmentId,
      status,
    }: { appointmentId: string; status: AppointmentStatus },
    { rejectWithValue }
  ) => {
    try {
      const response = await appointmentService.respondToAppointment(
        appointmentId,
        status
      );
      if (response) {
        // Load the updated appointment
        const updatedAppointment =
          await appointmentService.getAppointment(appointmentId);
        return updatedAppointment;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to send response'
      );
    }
  }
);

// Async thunk for canceling an appointment
export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response =
        await appointmentService.cancelAppointment(appointmentId);
      if (response) {
        // Load the updated appointment
        const updatedAppointment =
          await appointmentService.getAppointment(appointmentId);

        return updatedAppointment;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to cancel appointment'
      );
    }
  }
);

// Async thunk for completing an appointment
export const completeAppointment = createAsyncThunk(
  'appointments/completeAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response =
        await appointmentService.completeAppointment(appointmentId);
      if (response) {
        // Load the updated appointment
        const updatedAppointment =
          await appointmentService.getAppointment(appointmentId);
        return updatedAppointment;
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to complete appointment'
      );
    }
  }
);

// Appointments Slice
const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveAppointment: (
      state,
      action: PayloadAction<Appointment | undefined>
    ) => {
      state.activeAppointment = action.payload;
    },
  },
  extraReducers: (builder) => {
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
        state.error = action.error as SliceError;
      })
      // Fetch Appointment
      .addCase(fetchAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
      })
      .addCase(fetchAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
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
        state.error = action.error as SliceError;
      })
      // Respond To Appointment
      .addCase(respondToAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(respondToAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        // Update the appointment in the list as well
        const index = state.appointments.findIndex(
          (appointment) => appointment.id === action.payload?.id
        );
        if (index !== -1) {
          if (action.payload) {
            state.appointments[index] = action.payload;
          }
        }
      })
      .addCase(respondToAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })
      // Cancel Appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        // Update the appointment in the list as well
        const index = state.appointments.findIndex(
          (appointment) => appointment.id === action.payload?.id
        );
        if (index !== -1) {
          if (action.payload) {
            state.appointments[index] = action.payload;
          }
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })
      // Complete Appointment
      .addCase(completeAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        // Update the appointment in the list as well
        const index = state.appointments.findIndex(
          (appointment) => appointment.id === action.payload?.id
        );
        if (index !== -1) {
          if (action.payload) {
            state.appointments[index] = action.payload;
          }
        }
      })
      .addCase(completeAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      });
  },
});

export const { clearError, setActiveAppointment } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;