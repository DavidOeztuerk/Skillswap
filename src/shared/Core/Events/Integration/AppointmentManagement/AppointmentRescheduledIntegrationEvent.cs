namespace Events.Integration.AppointmentManagement;

/// <summary>
/// Integration event published when an appointment is rescheduled
/// Contains all necessary data for notification and other services
/// This is a simple POCO for cross-service communication via RabbitMQ
/// </summary>
public record AppointmentRescheduledIntegrationEvent
{
    // Event Metadata
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
    
    // Appointment Details
    public string AppointmentId { get; init; } = string.Empty;
    public DateTime OldScheduledDate { get; init; }
    public DateTime NewScheduledDate { get; init; }
    public int OldDurationMinutes { get; init; }
    public int NewDurationMinutes { get; init; }
    public string? Reason { get; init; }
    public string? MeetingLink { get; init; }
    
    // User who requested the reschedule
    public string RescheduledByUserId { get; init; } = string.Empty;
    public string RescheduledByEmail { get; init; } = string.Empty;
    public string RescheduledByFirstName { get; init; } = string.Empty;
    public string RescheduledByLastName { get; init; } = string.Empty;
    
    // Other participant
    public string OtherParticipantUserId { get; init; } = string.Empty;
    public string OtherParticipantEmail { get; init; } = string.Empty;
    public string OtherParticipantFirstName { get; init; } = string.Empty;
    public string OtherParticipantLastName { get; init; } = string.Empty;
    public string? OtherParticipantPhoneNumber { get; init; }
    
    // Skill Information
    public string? SkillId { get; init; }
    public string? SkillName { get; init; }
    public string? SkillCategory { get; init; }
    
    // Metadata
    public DateTime RescheduledAt { get; init; }
}