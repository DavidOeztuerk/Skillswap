namespace AppointmentService.Domain.Enums;

/// <summary>
/// Status of a single SessionAppointment (Phase 8 - converted from string constants)
/// </summary>
public enum SessionAppointmentStatus
{
    /// <summary>
    /// Session scheduled, awaiting confirmation from both parties
    /// </summary>
    Pending,

    /// <summary>
    /// Both parties confirmed, session locked in
    /// </summary>
    Confirmed,

    /// <summary>
    /// Reschedule requested by one party, awaiting approval
    /// </summary>
    RescheduleRequested,

    /// <summary>
    /// Session currently in progress
    /// </summary>
    InProgress,

    /// <summary>
    /// Session completed successfully
    /// </summary>
    Completed,

    /// <summary>
    /// Cancelled (may incur penalty if within 24h)
    /// </summary>
    Cancelled,

    /// <summary>
    /// One or both parties didn't show up
    /// </summary>
    NoShow,

    /// <summary>
    /// Awaiting payment completion before session can start
    /// </summary>
    WaitingForPayment,

    /// <summary>
    /// Payment completed, session can proceed
    /// </summary>
    PaymentCompleted
}
