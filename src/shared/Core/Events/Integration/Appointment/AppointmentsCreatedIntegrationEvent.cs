namespace Events.Integration.Appointment;

/// <summary>
/// Published when multiple appointments are created from a Match acceptance
/// Consumed by NotificationService to send email with all appointment details
/// </summary>
public record AppointmentsCreatedIntegrationEvent
{
    public string MatchId { get; init; }

    // Organizer (Requester) Details
    public string OrganizerUserId { get; init; }
    public string OrganizerEmail { get; init; }
    public string OrganizerName { get; init; }

    // Participant (Target User) Details
    public string ParticipantUserId { get; init; }
    public string ParticipantEmail { get; init; }
    public string ParticipantName { get; init; }

    // Skill Details
    public string SkillName { get; init; }
    public bool IsSkillExchange { get; init; }
    public string? ExchangeSkillName { get; init; }

    // Payment Details
    public bool IsMonetary { get; init; }
    public decimal? AgreedAmount { get; init; }
    public string? Currency { get; init; }

    // All created appointments with their meeting links
    public AppointmentSummary[] Appointments { get; init; }

    public DateTime CreatedAt { get; init; }

    public AppointmentsCreatedIntegrationEvent(
        string matchId,
        string organizerUserId,
        string organizerEmail,
        string organizerName,
        string participantUserId,
        string participantEmail,
        string participantName,
        string skillName,
        bool isSkillExchange,
        string? exchangeSkillName,
        bool isMonetary,
        decimal? agreedAmount,
        string? currency,
        AppointmentSummary[] appointments,
        DateTime createdAt)
    {
        MatchId = matchId;
        OrganizerUserId = organizerUserId;
        OrganizerEmail = organizerEmail;
        OrganizerName = organizerName;
        ParticipantUserId = participantUserId;
        ParticipantEmail = participantEmail;
        ParticipantName = participantName;
        SkillName = skillName;
        IsSkillExchange = isSkillExchange;
        ExchangeSkillName = exchangeSkillName;
        IsMonetary = isMonetary;
        AgreedAmount = agreedAmount;
        Currency = currency;
        Appointments = appointments;
        CreatedAt = createdAt;
    }
}

/// <summary>
/// Summary of a single appointment for notification purposes
/// </summary>
public record AppointmentSummary
{
    public string AppointmentId { get; init; }
    public string Title { get; init; }
    public DateTime ScheduledDate { get; init; }
    public int DurationMinutes { get; init; }
    public int SessionNumber { get; init; }
    public int TotalSessions { get; init; }
    public string MeetingLink { get; init; }
    public string Status { get; init; }

    /// <summary>
    /// For skill exchange: Indicates who teaches in this session
    /// Values: "Organizer" or "Participant"
    /// </summary>
    public string? TeacherRole { get; init; }

    public AppointmentSummary(
        string appointmentId,
        string title,
        DateTime scheduledDate,
        int durationMinutes,
        int sessionNumber,
        int totalSessions,
        string meetingLink,
        string status,
        string? teacherRole)
    {
        AppointmentId = appointmentId;
        Title = title;
        ScheduledDate = scheduledDate;
        DurationMinutes = durationMinutes;
        SessionNumber = sessionNumber;
        TotalSessions = totalSessions;
        MeetingLink = meetingLink;
        Status = status;
        TeacherRole = teacherRole;
    }
}
