import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { isDefined } from '../../../shared/utils/safeAccess';
import { type Appointment, AppointmentStatus } from '../types/Appointment';
import { initialAppointmentsState, appointmentsAdapter } from './appointmentsAdapter+State';
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
  getAppointmentStatistics,
} from './appointmentsThunks';

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: initialAppointmentsState,
  reducers: {
    // ==================== BASIC STATE MANAGEMENT ====================
    clearError: (state) => {
      state.errorMessage = undefined;
    },

    setActiveAppointment: (state, action: PayloadAction<Appointment | undefined>) => {
      state.activeAppointment = action.payload;
    },

    setFilters: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setPagination: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearAvailableSlots: (state) => {
      state.availableSlots = [];
    },

    // ==================== ENTITY ADAPTER OPERATIONS ====================

    /**
     * Update single appointment in normalized state
     */
    updateAppointmentInList: (state, action: PayloadAction<Appointment>) => {
      appointmentsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });

      // Update activeAppointment if it matches
      if (state.activeAppointment?.id === action.payload.id) {
        state.activeAppointment = action.payload;
      }
    },

    /**
     * Add single appointment to normalized state (from SignalR)
     */
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      appointmentsAdapter.upsertOne(state, action.payload);
    },

    /**
     * Add multiple appointments to normalized state (from SignalR batch)
     */
    addMany: (state, action: PayloadAction<Appointment[]>) => {
      appointmentsAdapter.upsertMany(state, action.payload);
    },

    /**
     * Upsert single appointment (update or insert)
     */
    upsertOne: (state, action: PayloadAction<Appointment>) => {
      appointmentsAdapter.upsertOne(state, action.payload);

      // Update activeAppointment if it matches
      if (state.activeAppointment?.id === action.payload.id) {
        state.activeAppointment = action.payload;
      }
    },

    /**
     * Remove appointment from normalized state
     */
    removeAppointmentFromList: (state, action: PayloadAction<string>) => {
      appointmentsAdapter.removeOne(state, action.payload);

      // Clear activeAppointment if it matches
      if (state.activeAppointment?.id === action.payload) {
        state.activeAppointment = undefined;
      }
    },

    /**
     * Optimistic update: Change appointment status immediately
     */
    updateAppointmentStatusOptimistic: (
      state,
      action: PayloadAction<{ appointmentId: string; status: AppointmentStatus }>
    ) => {
      const { appointmentId, status } = action.payload;

      appointmentsAdapter.updateOne(state, {
        id: appointmentId,
        changes: { status },
      });

      // Update activeAppointment if it matches
      if (state.activeAppointment?.id === appointmentId) {
        state.activeAppointment.status = status;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ==================== FETCH APPOINTMENTS (ALL) ====================
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          // Replace all entities with fetched data
          appointmentsAdapter.setAll(state, action.payload.data);
        } else {
          appointmentsAdapter.removeAll(state);
        }

        state.pagination = {
          page: action.payload.pageNumber,
          limit: action.payload.pageSize,
          total: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch appointments';
      })

      // ==================== FETCH SINGLE APPOINTMENT ====================
      .addCase(fetchAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAppointment.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          // Add or update in entities
          appointmentsAdapter.upsertOne(state, action.payload.data);
          state.activeAppointment = action.payload.data;
        }
      })
      .addCase(fetchAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch appointment';
      })

      // ==================== CREATE APPOINTMENT ====================
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          // Add new appointment to entities
          appointmentsAdapter.addOne(state, action.payload.data);
          state.activeAppointment = action.payload.data;
        }
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to create appointment';
      })

      // ==================== RESPOND TO APPOINTMENT ====================
      .addCase(respondToAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(respondToAppointment.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          appointmentsAdapter.upsertOne(state, action.payload.data);
          state.activeAppointment = action.payload.data;
        }
      })
      .addCase(respondToAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to respond to appointment';
      })

      // ==================== CANCEL APPOINTMENT ====================
      .addCase(cancelAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          appointmentsAdapter.upsertOne(state, action.payload.data);
          state.activeAppointment = action.payload.data;
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to cancel appointment';
      })

      // ==================== COMPLETE APPOINTMENT ====================
      .addCase(completeAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(completeAppointment.fulfilled, (state) => {
        state.isLoading = false;
        // Backend doesn't return updated appointment, rely on refetch
      })
      .addCase(completeAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to complete appointment';
      })

      // ==================== FETCH UPCOMING APPOINTMENTS ====================
      .addCase(fetchUpcomingAppointments.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchUpcomingAppointments.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          // Merge upcoming appointments into entities (upsertMany)
          appointmentsAdapter.upsertMany(state, action.payload.data);
        }
      })
      .addCase(fetchUpcomingAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ??
          action.error.message ??
          'Failed to fetch upcoming appointments';
      })

      // ==================== FETCH PAST APPOINTMENTS ====================
      .addCase(fetchPastAppointments.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchPastAppointments.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          // Merge past appointments into entities (upsertMany)
          appointmentsAdapter.upsertMany(state, action.payload.data);
        }

        state.pagination = {
          page: action.payload.pageNumber,
          limit: action.payload.pageSize,
          total: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchPastAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch past appointments';
      })

      // ==================== FETCH AVAILABLE SLOTS ====================
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoadingSlots = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, _action) => {
        state.isLoadingSlots = false;
        // TODO: Implement available slots handling
        //state.availableSlots = action.payload.data;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoadingSlots = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch available slots';
      })

      // ==================== UPDATE APPOINTMENT DETAILS ====================
      .addCase(updateAppointmentDetails.rejected, (state, action) => {
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to update appointment details';
      })

      // ==================== RESCHEDULE APPOINTMENT ====================
      .addCase(rescheduleAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          const { appointmentId } = action.payload.data;

          // Update status to Pending after reschedule
          appointmentsAdapter.updateOne(state, {
            id: appointmentId,
            changes: { status: AppointmentStatus.Pending },
          });

          if (state.activeAppointment?.id === appointmentId) {
            state.activeAppointment.status = AppointmentStatus.Pending;
          }
        }
      })
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to reschedule appointment';
      })

      // ==================== GENERATE MEETING LINK ====================
      .addCase(generateMeetingLink.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(generateMeetingLink.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          const meetingLink = action.payload.data;
          const appointmentId = action.meta.arg; // appointmentId from thunk args

          // Update meeting link in entities
          appointmentsAdapter.updateOne(state, {
            id: appointmentId,
            changes: { meetingLink },
          });

          if (state.activeAppointment?.id === appointmentId) {
            state.activeAppointment.meetingLink = meetingLink;
          }
        }
      })
      .addCase(generateMeetingLink.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to generate meeting link';
      })

      // ==================== RATE APPOINTMENT ====================
      .addCase(rateAppointment.rejected, (state, action) => {
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to rate appointment';
      })

      // ==================== REPORT APPOINTMENT ====================
      .addCase(reportAppointment.rejected, (state, action) => {
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to report appointment';
      })

      // ==================== GET STATISTICS ====================
      .addCase(getAppointmentStatistics.rejected, (state, action) => {
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to get appointment statistics';
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
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;
