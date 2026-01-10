using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;

namespace AppointmentService.Domain.StateMachines;

/// <summary>
/// State machine defining valid state transitions for SessionAppointment
/// Ensures business rules are enforced when changing appointment status
/// </summary>
public class SessionAppointmentStateMachine
{
    /// <summary>
    /// Defines all valid state transitions
    /// Key: Current state, Value: List of allowed next states
    /// </summary>
    private static readonly Dictionary<SessionAppointmentStatus, List<SessionAppointmentStatus>> StateTransitions = new()
    {
        // From Pending
        [SessionAppointmentStatus.Pending] = new List<SessionAppointmentStatus>
        {
            SessionAppointmentStatus.Confirmed,
            SessionAppointmentStatus.WaitingForPayment,
            SessionAppointmentStatus.Cancelled,
            SessionAppointmentStatus.NoShow
        },

        // From Confirmed
        [SessionAppointmentStatus.Confirmed] = new List<SessionAppointmentStatus>
        {
            SessionAppointmentStatus.RescheduleRequested,
            SessionAppointmentStatus.InProgress,
            SessionAppointmentStatus.Cancelled,
            SessionAppointmentStatus.NoShow,
            SessionAppointmentStatus.Completed // Allow direct completion
        },

        // From RescheduleRequested
        [SessionAppointmentStatus.RescheduleRequested] = new List<SessionAppointmentStatus>
        {
            SessionAppointmentStatus.Confirmed, // Approved or rejected
            SessionAppointmentStatus.Cancelled
        },

        // From InProgress
        [SessionAppointmentStatus.InProgress] = new List<SessionAppointmentStatus>
        {
            SessionAppointmentStatus.Completed,
            SessionAppointmentStatus.Cancelled // Emergency cancellation
        },

        // From WaitingForPayment
        [SessionAppointmentStatus.WaitingForPayment] = new List<SessionAppointmentStatus>
        {
            SessionAppointmentStatus.PaymentCompleted,
            SessionAppointmentStatus.Cancelled
        },

        // From PaymentCompleted
        [SessionAppointmentStatus.PaymentCompleted] = new List<SessionAppointmentStatus>
        {
            SessionAppointmentStatus.Confirmed,
            SessionAppointmentStatus.InProgress,
            SessionAppointmentStatus.Completed,
            SessionAppointmentStatus.Cancelled,
            SessionAppointmentStatus.NoShow
        },

        // Terminal states (no transitions allowed)
        [SessionAppointmentStatus.Completed] = new List<SessionAppointmentStatus>(),
        [SessionAppointmentStatus.Cancelled] = new List<SessionAppointmentStatus>(),
        [SessionAppointmentStatus.NoShow] = new List<SessionAppointmentStatus>()
    };

    /// <summary>
    /// Validates if a state transition is allowed
    /// </summary>
    /// <param name="currentState">Current state</param>
    /// <param name="newState">Proposed new state</param>
    /// <returns>True if transition is valid, false otherwise</returns>
    public static bool IsValidTransition(SessionAppointmentStatus currentState, SessionAppointmentStatus newState)
    {
        // Same state is always allowed (no-op)
        if (currentState == newState)
            return true;

        // Check if current state exists in transitions
        if (!StateTransitions.ContainsKey(currentState))
            return false;

        // Check if new state is in the allowed transitions list
        return StateTransitions[currentState].Contains(newState);
    }

    /// <summary>
    /// Gets all allowed next states from current state
    /// </summary>
    /// <param name="currentState">Current state</param>
    /// <returns>List of allowed next states</returns>
    public static List<SessionAppointmentStatus> GetAllowedTransitions(SessionAppointmentStatus currentState)
    {
        return StateTransitions.TryGetValue(currentState, out var transitions)
            ? transitions
            : new List<SessionAppointmentStatus>();
    }

    /// <summary>
    /// Checks if a state is a terminal state (no further transitions)
    /// </summary>
    /// <param name="state">State to check</param>
    /// <returns>True if terminal state</returns>
    public static bool IsTerminalState(SessionAppointmentStatus state)
    {
        return state == SessionAppointmentStatus.Completed ||
               state == SessionAppointmentStatus.Cancelled ||
               state == SessionAppointmentStatus.NoShow;
    }

    /// <summary>
    /// Checks if a state allows cancellation
    /// </summary>
    /// <param name="state">State to check</param>
    /// <returns>True if cancellation is allowed from this state</returns>
    public static bool CanBeCancelled(SessionAppointmentStatus state)
    {
        return StateTransitions.TryGetValue(state, out var transitions) &&
               transitions.Contains(SessionAppointmentStatus.Cancelled);
    }

    /// <summary>
    /// Checks if a state allows rescheduling
    /// </summary>
    /// <param name="state">State to check</param>
    /// <returns>True if reschedule request is allowed from this state</returns>
    public static bool CanBeRescheduled(SessionAppointmentStatus state)
    {
        return state == SessionAppointmentStatus.Confirmed ||
               state == SessionAppointmentStatus.PaymentCompleted;
    }

    /// <summary>
    /// Checks if an appointment can start (transition to InProgress)
    /// </summary>
    /// <param name="state">Current state</param>
    /// <returns>True if can start</returns>
    public static bool CanStart(SessionAppointmentStatus state)
    {
        return StateTransitions.TryGetValue(state, out var transitions) &&
               transitions.Contains(SessionAppointmentStatus.InProgress);
    }

    /// <summary>
    /// Checks if an appointment can be completed
    /// </summary>
    /// <param name="state">Current state</param>
    /// <returns>True if can be completed</returns>
    public static bool CanComplete(SessionAppointmentStatus state)
    {
        return StateTransitions.TryGetValue(state, out var transitions) &&
               transitions.Contains(SessionAppointmentStatus.Completed);
    }

    /// <summary>
    /// Validates transition and throws exception if invalid
    /// </summary>
    /// <param name="currentState">Current state</param>
    /// <param name="newState">Proposed new state</param>
    /// <exception cref="InvalidOperationException">Thrown when transition is not allowed</exception>
    public static void ValidateTransitionOrThrow(SessionAppointmentStatus currentState, SessionAppointmentStatus newState)
    {
        if (!IsValidTransition(currentState, newState))
        {
            var allowedTransitions = string.Join(", ", GetAllowedTransitions(currentState));
            throw new InvalidOperationException(
                $"Invalid state transition from '{currentState}' to '{newState}'. " +
                $"Allowed transitions: {(string.IsNullOrEmpty(allowedTransitions) ? "none (terminal state)" : allowedTransitions)}");
        }
    }

    /// <summary>
    /// Checks if payment is required before confirming
    /// </summary>
    /// <param name="isMonetary">Whether the session is payment-based</param>
    /// <param name="isPaymentCompleted">Whether payment has been completed</param>
    /// <returns>Next appropriate state</returns>
    public static SessionAppointmentStatus GetInitialState(bool isMonetary, bool isPaymentCompleted)
    {
        if (isMonetary && !isPaymentCompleted)
            return SessionAppointmentStatus.WaitingForPayment;

        return SessionAppointmentStatus.Pending;
    }

    /// <summary>
    /// Gets a human-readable description of what a state means
    /// </summary>
    /// <param name="state">State to describe</param>
    /// <returns>Description</returns>
    public static string GetStateDescription(SessionAppointmentStatus state)
    {
        return state switch
        {
            SessionAppointmentStatus.Pending => "Session scheduled, awaiting confirmation from both parties",
            SessionAppointmentStatus.Confirmed => "Both parties confirmed, session locked in",
            SessionAppointmentStatus.RescheduleRequested => "Reschedule requested by one party, awaiting approval from other",
            SessionAppointmentStatus.InProgress => "Session currently in progress",
            SessionAppointmentStatus.Completed => "Session completed successfully",
            SessionAppointmentStatus.Cancelled => "Session cancelled",
            SessionAppointmentStatus.NoShow => "One or both parties didn't show up",
            SessionAppointmentStatus.WaitingForPayment => "Awaiting payment completion before session can proceed",
            SessionAppointmentStatus.PaymentCompleted => "Payment completed, session can proceed",
            _ => "Unknown state"
        };
    }

    /// <summary>
    /// Validates business rules before state transition
    /// </summary>
    /// <param name="appointment">The appointment to validate</param>
    /// <param name="newState">Proposed new state</param>
    /// <exception cref="InvalidOperationException">Thrown when business rules are violated</exception>
    public static void ValidateBusinessRules(SessionAppointment appointment, SessionAppointmentStatus newState)
    {
        // Validate state machine transition
        ValidateTransitionOrThrow(appointment.Status, newState);

        // Additional business rules
        switch (newState)
        {
            case SessionAppointmentStatus.InProgress:
                // Can only start if scheduled date is close (within 30 minutes before to 2 hours after)
                var now = DateTime.UtcNow;
                var scheduledDate = appointment.ScheduledDate;
                var minutesBeforeStart = (scheduledDate - now).TotalMinutes;
                var minutesAfterStart = (now - scheduledDate).TotalMinutes;

                if (minutesBeforeStart > 30)
                {
                    throw new InvalidOperationException(
                        $"Cannot start session more than 30 minutes before scheduled time. " +
                        $"Scheduled for: {scheduledDate:yyyy-MM-dd HH:mm} UTC");
                }

                if (minutesAfterStart > 120)
                {
                    throw new InvalidOperationException(
                        $"Cannot start session more than 2 hours after scheduled time. " +
                        $"Session should be marked as NoShow. Scheduled for: {scheduledDate:yyyy-MM-dd HH:mm} UTC");
                }
                break;

            case SessionAppointmentStatus.RescheduleRequested:
                if (string.IsNullOrWhiteSpace(appointment.RescheduleReason))
                {
                    throw new InvalidOperationException("Reschedule reason is required");
                }
                if (!appointment.ProposedRescheduleDate.HasValue)
                {
                    throw new InvalidOperationException("Proposed reschedule date is required");
                }
                break;

            case SessionAppointmentStatus.Cancelled:
                if (string.IsNullOrWhiteSpace(appointment.CancelledByUserId))
                {
                    throw new InvalidOperationException("CancelledByUserId is required");
                }
                break;

            case SessionAppointmentStatus.NoShow:
                if (string.IsNullOrWhiteSpace(appointment.NoShowUserIds))
                {
                    throw new InvalidOperationException("NoShowUserIds is required");
                }
                break;

            case SessionAppointmentStatus.PaymentCompleted:
                if (!appointment.IsPaymentCompleted)
                {
                    throw new InvalidOperationException("Payment must be marked as completed");
                }
                break;
        }
    }
}
