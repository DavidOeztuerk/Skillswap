namespace AppointmentService.Domain.Entities;

/// <summary>
/// Status of a single SessionAppointment
/// Enhanced state machine with cancellation policies and no-show tracking
/// </summary>
public static class SessionAppointmentStatus
{
    /// <summary>
    /// Session scheduled, awaiting confirmation from both parties
    /// </summary>
    public const string Pending = "Pending";

    /// <summary>
    /// Both parties confirmed, session locked in
    /// </summary>
    public const string Confirmed = "Confirmed";

    /// <summary>
    /// Reschedule requested by one party, awaiting approval
    /// </summary>
    public const string RescheduleRequested = "RescheduleRequested";

    /// <summary>
    /// Session currently in progress
    /// </summary>
    public const string InProgress = "InProgress";

    /// <summary>
    /// Session completed successfully
    /// </summary>
    public const string Completed = "Completed";

    /// <summary>
    /// Cancelled within 24h policy window (may incur penalty)
    /// </summary>
    public const string Cancelled = "Cancelled";

    /// <summary>
    /// One or both parties didn't show up
    /// </summary>
    public const string NoShow = "NoShow";

    /// <summary>
    /// Awaiting payment completion before session can start
    /// </summary>
    public const string WaitingForPayment = "WaitingForPayment";

    /// <summary>
    /// Payment completed, session can proceed
    /// </summary>
    public const string PaymentCompleted = "PaymentCompleted";
}
