namespace Events.Integration.AppointmentManagement;

/// <summary>
/// Integration event published when a meeting link is generated for an appointment
/// Contains all necessary data for notification services
/// This is a simple POCO for cross-service communication via RabbitMQ
/// </summary>
public record MeetingLinkGeneratedIntegrationEvent
{
    // Event Metadata
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
    
    // Appointment Details
    public string AppointmentId { get; init; } = string.Empty;
    public string MeetingLink { get; init; } = string.Empty;
    public DateTime ScheduledDate { get; init; }
    public int DurationMinutes { get; init; }
    
    // Participant 1 (Organizer)
    public string ParticipantOneId { get; init; } = string.Empty;
    public string ParticipantOneEmail { get; init; } = string.Empty;
    public string ParticipantOneFirstName { get; init; } = string.Empty;
    public string ParticipantOneLastName { get; init; } = string.Empty;
    
    // Participant 2
    public string ParticipantTwoId { get; init; } = string.Empty;
    public string ParticipantTwoEmail { get; init; } = string.Empty;
    public string ParticipantTwoFirstName { get; init; } = string.Empty;
    public string ParticipantTwoLastName { get; init; } = string.Empty;
    
    // Skill Information
    public string? SkillName { get; init; }
    public string? SkillCategory { get; init; }
    
    // Metadata
    public DateTime GeneratedAt { get; init; }
}