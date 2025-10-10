using Contracts.Appointment.Responses;

namespace AppointmentService.Application.Services.Orchestration;

/// <summary>
/// Service for enriching appointment data with information from other services
/// </summary>
public interface IAppointmentDataEnrichmentService
{
    /// <summary>
    /// Enriches appointment details with user profiles, skill information, and meeting links
    /// </summary>
    Task<EnrichedAppointmentDetailsResponse> GetEnrichedAppointmentAsync(string appointmentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets enriched appointment list for a user with all cross-service data
    /// </summary>
    Task<List<EnrichedAppointmentListItemResponse>> GetEnrichedUserAppointmentsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets appointment analytics with aggregated data from multiple services
    /// </summary>
    Task<AppointmentAnalyticsResponse> GetAppointmentAnalyticsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Prepares comprehensive appointment data for calendar integration
    /// </summary>
    Task<AppointmentCalendarDataResponse> GetAppointmentCalendarDataAsync(string appointmentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets appointment recommendations based on user skills and history
    /// </summary>
    Task<List<AppointmentRecommendationResponse>> GetAppointmentRecommendationsAsync(string userId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Enriched appointment details with full cross-service context
/// </summary>
public record EnrichedAppointmentDetailsResponse(
    GetAppointmentDetailsResponse Appointment,
    EnrichedParticipantInfo Organizer,
    EnrichedParticipantInfo Participant,
    SkillContextInfo? SkillContext,
    MatchContextInfo? MatchContext,
    MeetingInfo MeetingInfo,
    List<RelatedAppointmentInfo> RelatedAppointments)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Enriched appointment list item for efficient display
/// </summary>
public record EnrichedAppointmentListItemResponse(
    string AppointmentId,
    string Title,
    DateTime ScheduledDate,
    int DurationMinutes,
    string Status,
    ParticipantSummary OtherParticipant,
    SkillSummary? Skill,
    string MeetingType,
    string? MeetingLink,
    bool CanReschedule,
    bool CanCancel)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Comprehensive appointment analytics
/// </summary>
public record AppointmentAnalyticsResponse(
    AppointmentCountStatistics Counts,
    AppointmentRatingStatistics Ratings,
    AppointmentTimeStatistics TimeAnalytics,
    List<SkillAppointmentStatistics> SkillBreakdown,
    AppointmentTrendData Trends,
    DateTime AnalyticsPeriodStart,
    DateTime AnalyticsPeriodEnd)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Calendar integration data
/// </summary>
public record AppointmentCalendarDataResponse(
    string AppointmentId,
    string CalendarTitle,
    string CalendarDescription,
    DateTime StartTime,
    DateTime EndTime,
    string Location,
    List<CalendarParticipant> Participants,
    List<CalendarReminder> Reminders,
    CalendarMetadata Metadata)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Appointment recommendation
/// </summary>
public record AppointmentRecommendationResponse(
    string RecommendationType,
    string Title,
    string Description,
    RecommendedParticipant SuggestedParticipant,
    SkillSummary Skill,
    List<DateTime> SuggestedTimes,
    double ConfidenceScore,
    string ReasonForRecommendation)
{
    public string ApiVersion => "v1";
}

// Supporting DTOs
public record EnrichedParticipantInfo(
    string UserId,
    string Name,
    string Email,
    string? ProfilePictureUrl,
    string? Bio,
    string? TimeZone,
    UserSkillsSummary Skills,
    UserReputationInfo Reputation,
    bool IsOnline,
    DateTime? LastActive);

public record SkillContextInfo(
    string SkillId,
    string Name,
    string Category,
    string Description,
    SkillLevel OrganizerLevel,
    SkillLevel ParticipantLevel,
    List<string> LearningObjectives);

public record MatchContextInfo(
    string MatchId,
    string MatchType,
    DateTime MatchCreatedDate,
    string SkillOffered,
    string SkillWanted,
    double MatchScore);

public record MeetingInfo(
    string MeetingType,
    string? MeetingLink,
    string? MeetingId,
    string? MeetingPassword,
    Dictionary<string, string> MeetingMetadata,
    bool IsRecurring,
    RecurrenceInfo? Recurrence);

public record RelatedAppointmentInfo(
    string AppointmentId,
    string Title,
    DateTime ScheduledDate,
    string Status,
    string RelationType);

public record ParticipantSummary(
    string UserId,
    string Name,
    string? ProfilePictureUrl,
    double Rating,
    int CompletedAppointments);

public record SkillSummary(
    string SkillId,
    string Name,
    string Category,
    string ProficiencyLevel);

public record AppointmentCountStatistics(
    int Total,
    int Completed,
    int Cancelled,
    int Upcoming,
    int Overdue,
    double CompletionRate,
    double CancellationRate);

public record AppointmentRatingStatistics(
    double AverageRating,
    int TotalRatings,
    Dictionary<int, int> RatingDistribution,
    double RecentRatingTrend);

public record AppointmentTimeStatistics(
    double AverageDurationMinutes,
    Dictionary<string, int> TimeSlotPreferences,
    Dictionary<string, int> DayOfWeekDistribution,
    int TotalMinutesSpent);

public record SkillAppointmentStatistics(
    string SkillId,
    string SkillName,
    string Category,
    int AppointmentCount,
    double AverageRating,
    int TotalMinutes);

public record AppointmentTrendData(
    List<MonthlyAppointmentData> MonthlyTrends,
    List<WeeklyAppointmentData> WeeklyTrends,
    string TrendDirection,
    double GrowthRate);

public record CalendarParticipant(
    string Name,
    string Email,
    string Role,
    string Status);

public record CalendarReminder(
    int MinutesBefore,
    string Method,
    string Message);

public record CalendarMetadata(
    string Source,
    string AppointmentType,
    Dictionary<string, string> CustomFields);

public record RecommendedParticipant(
    string UserId,
    string Name,
    string? ProfilePictureUrl,
    double MatchScore,
    List<string> SharedSkills,
    string RecommendationReason);

public record UserSkillsSummary(
    int TotalSkills,
    List<string> TopSkills,
    double AverageRating,
    List<string> Specializations);

public record UserReputationInfo(
    double OverallRating,
    int TotalReviews,
    int CompletedAppointments,
    DateTime MemberSince,
    List<string> Badges);

public record SkillLevel(
    string Level,
    int Rank,
    string Description);

public record RecurrenceInfo(
    string Pattern,
    int Interval,
    DateTime? EndDate,
    int? Occurrences);

public record MonthlyAppointmentData(
    int Year,
    int Month,
    int Count,
    double AverageRating,
    int CompletedCount);

public record WeeklyAppointmentData(
    DateTime WeekStart,
    int Count,
    int CompletedCount,
    double CompletionRate);