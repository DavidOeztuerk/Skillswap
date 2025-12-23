namespace Events.Integration.Moderation;

/// <summary>
/// Integration event published when an appointment is reported for moderation
/// Consumed by NotificationService for admin notifications and moderation queue
/// </summary>
public record AppointmentReportedIntegrationEvent
{
    public required string ReportId { get; init; }
    public required string AppointmentId { get; init; }
    public required string ReportedByUserId { get; init; }
    public required string ReportedUserId { get; init; }
    public required string Reason { get; init; }
    public string? Details { get; init; }
    public required DateTime ReportedAt { get; init; }
}
