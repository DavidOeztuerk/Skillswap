namespace AppointmentService.Domain.Enums;

/// <summary>
/// Status of a Connection between users (Phase 8 - converted from string constants)
/// </summary>
public enum ConnectionStatus
{
    /// <summary>
    /// Connection is active and sessions can be scheduled
    /// </summary>
    Active,

    /// <summary>
    /// Connection is temporarily paused by mutual agreement
    /// </summary>
    Paused,

    /// <summary>
    /// All planned sessions completed successfully
    /// </summary>
    Completed,

    /// <summary>
    /// Connection was dissolved before completion
    /// </summary>
    Dissolved
}
