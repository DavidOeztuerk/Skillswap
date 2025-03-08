// src/features/appointments/appointmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import appointmentService from '../../api/services/appointmentService';
import { AppointmentsState } from '../../types/states/AppointmentsState';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';

// Initialer State für den Appointments-Reducer
const initialState: AppointmentsState = {
  appointments: [],
  activeAppointment: undefined,
  isLoading: false,
  error: null,
};

// Async Thunk für das Laden aller Termine
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointments();
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Termine konnten nicht geladen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Termine konnten nicht geladen werden'
      );
    }
  }
);

// Async Thunk für das Laden eines einzelnen Termins
export const fetchAppointment = createAsyncThunk(
  'appointments/fetchAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointment(appointmentId);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Termin konnte nicht geladen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Termin konnte nicht geladen werden'
      );
    }
  }
);

// Async Thunk für das Erstellen eines Termins
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: AppointmentRequest, { rejectWithValue }) => {
    try {
      const response =
        await appointmentService.createAppointment(appointmentData);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Termin konnte nicht erstellt werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Termin konnte nicht erstellt werden'
      );
    }
  }
);

// Async Thunk für das Antworten auf eine Terminanfrage
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
        // Lade den aktualisierten Termin
        const updatedAppointment =
          await appointmentService.getAppointment(appointmentId);
        return updatedAppointment;
        // if (updatedAppointment.success && updatedAppointment.data) {
        //   return updatedAppointment.data;
        // }
      }
      // return rejectWithValue(
      //   response.message || 'Antwort konnte nicht gesendet werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Antwort konnte nicht gesendet werden'
      );
    }
  }
);

// Async Thunk für das Absagen eines Termins
export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response =
        await appointmentService.cancelAppointment(appointmentId);
      if (response) {
        // Lade den aktualisierten Termin
        const updatedAppointment =
          await appointmentService.getAppointment(appointmentId);

        return updatedAppointment;
        // if (updatedAppointment.success && updatedAppointment.data) {
        //   return updatedAppointment.data;
        // }
      }
      // return rejectWithValue(
      //   response.message || 'Termin konnte nicht abgesagt werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Termin konnte nicht abgesagt werden'
      );
    }
  }
);

// Async Thunk für das Abschließen eines Termins
export const completeAppointment = createAsyncThunk(
  'appointments/completeAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response =
        await appointmentService.completeAppointment(appointmentId);
      if (response) {
        // Lade den aktualisierten Termin
        const updatedAppointment =
          await appointmentService.getAppointment(appointmentId);
        // if (updatedAppointment.success && updatedAppointment.data) {
        //   return updatedAppointment.data;
        // }
        return updatedAppointment;
      }
      // return rejectWithValue(
      //   response.message || 'Termin konnte nicht abgeschlossen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Termin konnte nicht abgeschlossen werden'
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
      })
      // Respond To Appointment
      .addCase(respondToAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(respondToAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        // Aktualisiere auch den Termin in der Liste
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
        state.error = action.payload as string;
      })
      // Cancel Appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        // Aktualisiere auch den Termin in der Liste
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
        state.error = action.payload as string;
      })
      // Complete Appointment
      .addCase(completeAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeAppointment = action.payload;
        // Aktualisiere auch den Termin in der Liste
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
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setActiveAppointment } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
