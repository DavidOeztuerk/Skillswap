namespace AppointmentService.Domain.Entities;

/// <summary>
/// Status of a Connection (partnership between two users)
/// </summary>
public static class ConnectionStatus
{
    /// <summary>
    /// Connection is active and sessions can be scheduled
    /// </summary>
    public const string Active = "Active";

    /// <summary>
    /// Connection is temporarily paused by mutual agreement
    /// </summary>
    public const string Paused = "Paused";

    /// <summary>
    /// All planned sessions completed successfully
    /// </summary>
    public const string Completed = "Completed";

    /// <summary>
    /// Connection was dissolved before completion
    /// </summary>
    public const string Dissolved = "Dissolved";
}
