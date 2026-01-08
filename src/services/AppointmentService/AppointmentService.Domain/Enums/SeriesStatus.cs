namespace AppointmentService.Domain.Enums;

/// <summary>
/// Status of a SessionSeries (Phase 8 - converted from string constants)
/// </summary>
public enum SeriesStatus
{
    /// <summary>
    /// Sessions are being planned
    /// </summary>
    Planned,

    /// <summary>
    /// At least one session has started
    /// </summary>
    InProgress,

    /// <summary>
    /// All sessions completed
    /// </summary>
    Completed,

    /// <summary>
    /// Series was cancelled before completion
    /// </summary>
    Cancelled,

    /// <summary>
    /// On hold due to rescheduling or other issues
    /// </summary>
    OnHold
}
