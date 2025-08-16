namespace Events.Integration.AppointmentManagement;

/// <summary>
/// Integration event published when an appointment is accepted by both parties
/// Contains all necessary data for notification and other services
/// This is a simple POCO for cross-service communication via RabbitMQ
/// </summary>
public record AppointmentAcceptedIntegrationEvent
{
    // Event Metadata
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
    
    // Appointment Details
    public string AppointmentId { get; init; } = string.Empty;
    public DateTime ScheduledDate { get; init; }
    public int DurationMinutes { get; init; }
    public string? MeetingLink { get; init; }
    
    // Organizer Information
    public string OrganizerUserId { get; init; } = string.Empty;
    public string OrganizerEmail { get; init; } = string.Empty;
    public string OrganizerFirstName { get; init; } = string.Empty;
    public string OrganizerLastName { get; init; } = string.Empty;
    public string? OrganizerPhoneNumber { get; init; }
    
    // Participant Information
    public string ParticipantUserId { get; init; } = string.Empty;
    public string ParticipantEmail { get; init; } = string.Empty;
    public string ParticipantFirstName { get; init; } = string.Empty;
    public string ParticipantLastName { get; init; } = string.Empty;
    public string? ParticipantPhoneNumber { get; init; }
    
    // Skill Information
    public string? SkillId { get; init; }
    public string? SkillName { get; init; }
    public string? SkillCategory { get; init; }
    public string? SkillDescription { get; init; }
    
    // Metadata
    public DateTime AcceptedAt { get; init; }
    public bool BothPartiesAccepted { get; init; }
}