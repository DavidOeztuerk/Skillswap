import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { isDefined } from '../../utils/safeAccess';
import {
  initialAppointmentsState,
  appointmentsAdapter
} from '../../store/adapters/appointmentsAdapter+State';
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

/**
 * APPOINTMENTS SLICE - REFACTORED WITH ENTITY ADAPTER
 *
 * ✅ Pattern: Use EntityAdapter for normalized state
 * ✅ Removed duplicate arrays (appointments, upcomingAppointments, pastAppointments)
 * ✅ All operations use adapter methods: setAll, addOne, updateOne, removeOne
 * ✅ Selectors will compute derived data (upcoming/past) from entities
 */

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

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setPagination: (state, action) => {
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
    updateAppointmentStatusOptimistic: (state, action: PayloadAction<{ appointmentId: string; status: AppointmentStatus }>) => {
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
          page: action.payload.pagination.pageNumber ?? 1,
          limit: action.payload.pagination.pageSize ?? 10,
          total: action.payload.pagination.totalRecords ?? 0,
          totalPages: action.payload.pagination.totalPages ?? 0,
        };
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = action.payload?.message;
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
          page: action.payload.pagination.pageNumber ?? 1,
          limit: action.payload.pagination.pageSize ?? 10,
          total: action.payload.pagination.totalRecords ?? 0,
          totalPages: action.payload.pagination.totalPages ?? 0,
        };
      })
      .addCase(fetchPastAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== FETCH AVAILABLE SLOTS ====================
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoadingSlots = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoadingSlots = false;
        state.availableSlots = action.payload.data ?? [];
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoadingSlots = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== UPDATE APPOINTMENT DETAILS ====================
      .addCase(updateAppointmentDetails.rejected, (state, action) => {
        state.errorMessage = action.payload?.message;
      })

      // ==================== RESCHEDULE APPOINTMENT ====================
      .addCase(rescheduleAppointment.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          const appointmentId = action.payload.data.appointmentId;

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
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = action.payload?.message;
      })

      // ==================== RATE APPOINTMENT ====================
      .addCase(rateAppointment.rejected, (state, action) => {
        state.errorMessage = action.payload?.message;
      })

      // ==================== REPORT APPOINTMENT ====================
      .addCase(reportAppointment.rejected, (state, action) => {
        state.errorMessage = action.payload?.message;
      })

      // ==================== GET STATISTICS ====================
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
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;
