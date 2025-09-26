import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { withDefault, isDefined } from '../../utils/safeAccess';
import { AppointmentsEntityState, initialAppointmentsState } from '../../store/adapters/appointmentsAdapter+State';
import { 
  fetchAppointments,
  fetchAppointment, 
  createAppointment, 
  respondToAppointment, 
  cancelAppointment, 
  completeAppointment, 
  fetchUpcomingAppointments, 
  fetchPastAppointments, 
  fetchAvailableSlots, 
  updateAppointmentDetails, 
  rescheduleAppointment, 
  generateMeetingLink, 
  rateAppointment, 
  reportAppointment, 
  getAppointmentStatistics 
} from './appointmentsThunks';

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: initialAppointmentsState,
  reducers: {
    clearError: (state) => {
      state.errorMessage = undefined;
    },
    setActiveAppointment: (state, action) => {
      state.activeAppointment = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateAppointmentInList: (state, action) => {
      const index = state.appointments.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
    },
    removeAppointmentFromList: (state, action) => {
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
    setAppointments: (state, action) => {
      state.appointments = action.payload;
    },
    
    setUpcomingAppointments: (state, action) => {
      state.upcomingAppointments = action.payload;
    },
    
    setPastAppointments: (state, action) => {
      state.pastAppointments = action.payload;
    },
  },
  extraReducers: (builder) => {
    const updateAppointmentInList = (state: AppointmentsEntityState, appointment: Appointment) => {
      const index = state.appointments.findIndex(a => a.id === appointment.id);
      if (index !== -1) {
        state.appointments[index] = appointment;
      }
    };

    builder
      // Fetch Appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.appointments = action.payload.data;
        } else {
          state.appointments = [];
        }
        state.pagination = {
          page: withDefault(action.payload.pagination.pageNumber, 1),
          limit: withDefault(action.payload.pagination.pageSize, 10),
          total: withDefault(action.payload.pagination.totalRecords, 0),
          totalPages: withDefault(action.payload.pagination.totalPages, 0),
        };
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Fetch Single Appointment
      .addCase(fetchAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.activeAppointment = action.payload.data;
          updateAppointmentInList(state, action.payload.data);
        }
      })
      .addCase(fetchAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Create Appointment
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.appointments.push(action.payload.data);
          state.activeAppointment = action.payload.data;
        }
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Respond To Appointment
      .addCase(respondToAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(respondToAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.activeAppointment = action.payload.data;
          updateAppointmentInList(state, action.payload.data);
        }
      })
      .addCase(respondToAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Cancel Appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.activeAppointment = action.payload.data;
          updateAppointmentInList(state, action.payload.data);
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Complete Appointment
      .addCase(completeAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(completeAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Fetch Upcoming Appointments
      .addCase(fetchUpcomingAppointments.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchUpcomingAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.upcomingAppointments = action.payload.data;
        } else {
          state.upcomingAppointments = [];
        }
      })
      .addCase(fetchUpcomingAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Fetch Past Appointments
      .addCase(fetchPastAppointments.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchPastAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.pastAppointments = action.payload.data;
        } else {
          state.pastAppointments = [];
        }
        state.pagination = {
          page: withDefault(action.payload.pagination.pageNumber, 1),
          limit: withDefault(action.payload.pagination.pageSize, 10),
          total: withDefault(action.payload.pagination.totalRecords, 0),
          totalPages: withDefault(action.payload.pagination.totalPages, 0),
        };
      })
      .addCase(fetchPastAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Fetch Available Slots
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoadingSlots = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoadingSlots = false;
        if (isDefined(action.payload.data)) {
          state.availableSlots = action.payload.data;
        } else {
          state.availableSlots = [];
        }
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoadingSlots = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Update Appointment Details
      .addCase(updateAppointmentDetails.rejected, (state, action) => {
        state.errorMessage = action.payload?.message;
      })
      
      // Reschedule Appointment
      .addCase(rescheduleAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          const appointmentId = action.payload.data.appointmentId;
          // Mark as pending after reschedule - we might need to refetch the appointment for full data
          const index = state.appointments.findIndex(a => a.id === appointmentId);
          if (index !== -1) {
            state.appointments[index].status = AppointmentStatus.Pending;
          }
          if (state.activeAppointment?.id === appointmentId) {
            state.activeAppointment.status = AppointmentStatus.Pending;
          }
          const upcomingIndex = state.upcomingAppointments.findIndex(a => a.id === appointmentId);
          if (upcomingIndex !== -1) {
            state.upcomingAppointments[upcomingIndex].status = AppointmentStatus.Pending;
          }
        }
      })
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Generate Meeting Link
      .addCase(generateMeetingLink.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(generateMeetingLink.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data) && isDefined(action.payload.data)) {
          const meetingLink = action.payload.data;
          const appointmentId = action.meta.arg;
          
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
        }
      })
      .addCase(generateMeetingLink.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })
      
      // Rate Appointment
      .addCase(rateAppointment.rejected, (state, action) => {
        state.errorMessage = action.payload?.message;
      })
      
      // Report Appointment
      .addCase(reportAppointment.rejected, (state, action) => {
        state.errorMessage = action.payload?.message;
      })
      
      // Get Statistics
      .addCase(getAppointmentStatistics.rejected, (state, action) => {
        state.errorMessage = action.payload?.message;
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
