namespace AppointmentService.Domain.Entities;

/// <summary>
/// Status of a SessionSeries (group of related sessions)
/// </summary>
public static class SeriesStatus
{
    /// <summary>
    /// Sessions are being planned
    /// </summary>
    public const string Planned = "Planned";

    /// <summary>
    /// At least one session has started
    /// </summary>
    public const string InProgress = "InProgress";

    /// <summary>
    /// All sessions completed
    /// </summary>
    public const string Completed = "Completed";

    /// <summary>
    /// Series was cancelled before completion
    /// </summary>
    public const string Cancelled = "Cancelled";

    /// <summary>
    /// On hold due to rescheduling or other issues
    /// </summary>
    public const string OnHold = "OnHold";
}
