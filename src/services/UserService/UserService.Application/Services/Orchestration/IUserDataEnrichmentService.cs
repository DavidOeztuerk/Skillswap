using Contracts.User.Responses;

namespace UserService.Application.Services.Orchestration;

/// <summary>
/// Service for enriching user data with information from other services
/// </summary>
public interface IUserDataEnrichmentService
{
    /// <summary>
    /// Enriches user profile with skills, matches, and other cross-service data
    /// </summary>
    Task<EnrichedUserProfileResponse> GetEnrichedUserProfileAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets user dashboard data with aggregated information from all services
    /// </summary>
    Task<UserDashboardResponse> GetUserDashboardAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Enriches multiple user profiles efficiently for listings
    /// </summary>
    Task<List<EnrichedUserListItemResponse>> GetEnrichedUserListAsync(List<string> userIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets comprehensive user statistics from all services
    /// </summary>
    Task<UserStatisticsResponse> GetUserStatisticsAsync(string userId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Enriched user profile with cross-service data
/// </summary>
public record EnrichedUserProfileResponse(
    UserProfileResponse Profile,
    UserSkillsStatistics Skills,
    UserMatchingStatistics Matching,
    UserAppointmentStatistics Appointments,
    UserNotificationStatistics Notifications,
    DateTime LastActivity)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// User dashboard with aggregated data
/// </summary>
public record UserDashboardResponse(
    UserProfileResponse Profile,
    List<UserSkillSummary> TopSkills,
    List<RecentMatchSummary> RecentMatches,
    List<UpcomingAppointmentSummary> UpcomingAppointments,
    List<NotificationSummary> RecentNotifications,
    UserActivitySummary ActivitySummary)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Enriched user item for listings
/// </summary>
public record EnrichedUserListItemResponse(
    string UserId,
    string DisplayName,
    string? ProfilePictureUrl,
    UserSkillsStatistics Skills,
    UserRatingSummary Rating,
    DateTime LastActive,
    bool IsOnline)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Comprehensive user statistics
/// </summary>
public record UserStatisticsResponse(
    UserSkillsStatistics Skills,
    UserMatchingStatistics Matching,
    UserAppointmentStatistics Appointments,
    UserEngagementStatistics Engagement,
    DateTime PeriodStart,
    DateTime PeriodEnd)
{
    public string ApiVersion => "v1";
}

// Supporting DTOs
public record UserSkillsStatistics(
    int TotalSkills,
    int OfferedSkills,
    int WantedSkills,
    double AverageRating,
    int TotalEndorsements,
    List<string> TopCategories);

public record UserMatchingStatistics(
    int TotalMatches,
    int ActiveMatches,
    int CompletedMatches,
    int PendingRequests,
    double SuccessRate,
    DateTime? LastMatchDate);

public record UserAppointmentStatistics(
    int TotalAppointments,
    int CompletedAppointments,
    int CancelledAppointments,
    int UpcomingAppointments,
    double CompletionRate,
    DateTime? NextAppointment);

public record UserNotificationStatistics(
    int UnreadCount,
    int TotalReceived,
    DateTime? LastNotification,
    List<string> PreferredTypes);

public record UserSkillSummary(
    string SkillId,
    string Name,
    string Category,
    string ProficiencyLevel,
    double? Rating,
    int EndorsementCount);

public record RecentMatchSummary(
    string MatchId,
    string OtherUserName,
    string SkillOffered,
    string SkillWanted,
    string Status,
    DateTime CreatedDate);

public record UpcomingAppointmentSummary(
    string AppointmentId,
    string Title,
    DateTime ScheduledDate,
    string OtherParticipant,
    string MeetingType);

public record NotificationSummary(
    string NotificationId,
    string Type,
    string Title,
    DateTime CreatedDate,
    bool IsRead);

public record UserActivitySummary(
    DateTime LastLogin,
    int DaysActive,
    int ActionsToday,
    int ActionsThisWeek,
    string MostActiveTimeSlot);

public record UserRatingSummary(
    double AverageRating,
    int TotalRatings,
    Dictionary<int, int> RatingDistribution);

public record UserEngagementStatistics(
    int ProfileViews,
    int SkillsAdded,
    int MatchesInitiated,
    int AppointmentsScheduled,
    double EngagementScore);