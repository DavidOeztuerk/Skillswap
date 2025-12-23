namespace AppointmentService.Domain.Services;

/// <summary>
/// Enriched appointment data with user and skill information
/// </summary>
public class EnrichedAppointmentData
{
    public string AppointmentId { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public int DurationMinutes { get; set; }
    public string? MeetingLink { get; set; }
    public string Status { get; set; } = string.Empty;
    public UserData Organizer { get; set; } = new();
    public UserData Participant { get; set; } = new();
    public SkillData? Skill { get; set; }

    // Match/Connection Rollen - KONSTANT durch die gesamte Kette
    // MatchRequester = Der User der die ursprüngliche Matchanfrage gestellt hat (INITIATOR)
    // MatchTarget = Der Skill-Besitzer (PARTICIPANT)
    public UserData? MatchRequester { get; set; }
    public UserData? MatchTarget { get; set; }
}

public class UserData
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class SkillData
{
    public string SkillId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Description { get; set; }
}
