using Contracts.Matchmaking.Responses;

namespace MatchmakingService.Application.Services.Orchestration;

/// <summary>
/// Service for orchestrating complex match workflows across multiple services
/// </summary>
public interface IMatchOrchestrationService
{
    /// <summary>
    /// Orchestrates the complete match creation workflow
    /// </summary>
    Task<CompleteMatchWorkflowResponse> CreateCompleteMatchWorkflowAsync(CreateMatchWorkflowRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Orchestrates match acceptance with appointment scheduling
    /// </summary>
    Task<MatchAcceptanceWorkflowResponse> AcceptMatchWithAppointmentAsync(AcceptMatchWorkflowRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Orchestrates match completion with skill validation and notifications
    /// </summary>
    Task<MatchCompletionWorkflowResponse> CompleteMatchWorkflowAsync(CompleteMatchWorkflowRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Orchestrates smart match recommendations based on user behavior
    /// </summary>
    Task<SmartMatchRecommendationsResponse> GetSmartMatchRecommendationsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Orchestrates batch match processing for improved efficiency
    /// </summary>
    Task<BatchMatchProcessingResponse> ProcessBatchMatchesAsync(BatchMatchProcessingRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// Complete match creation workflow request
/// </summary>
public record CreateMatchWorkflowRequest(
    string InitiatorUserId,
    string TargetUserId,
    string OfferedSkillId,
    string WantedSkillId,
    string Message,
    List<DateTime> PreferredMeetingTimes,
    bool AutoCreateAppointment = false);

/// <summary>
/// Match acceptance with appointment workflow request
/// </summary>
public record AcceptMatchWorkflowRequest(
    string MatchId,
    string AcceptingUserId,
    DateTime? PreferredAppointmentTime,
    string? AppointmentMessage,
    int AppointmentDurationMinutes = 60);

/// <summary>
/// Match completion workflow request
/// </summary>
public record CompleteMatchWorkflowRequest(
    string MatchId,
    string CompletingUserId,
    int Rating,
    string? Feedback,
    List<string> SkillsLearned,
    bool RecommendToOthers = true);

/// <summary>
/// Batch match processing request
/// </summary>
public record BatchMatchProcessingRequest(
    List<string> UserIds,
    List<string> SkillIds,
    MatchingCriteria Criteria,
    int MaxMatchesPerUser = 5);

/// <summary>
/// Complete match workflow response
/// </summary>
public record CompleteMatchWorkflowResponse(
    MatchCreationResult MatchResult,
    UserNotificationResult NotificationResult,
    SkillValidationResult SkillValidation,
    AppointmentCreationResult? AppointmentResult,
    WorkflowStatus Status,
    List<string> Warnings)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Match acceptance workflow response
/// </summary>
public record MatchAcceptanceWorkflowResponse(
    MatchAcceptanceResult MatchResult,
    AppointmentCreationResult AppointmentResult,
    NotificationResult NotificationResult,
    CalendarIntegrationResult? CalendarResult,
    WorkflowStatus Status)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Match completion workflow response
/// </summary>
public record MatchCompletionWorkflowResponse(
    MatchCompletionResult MatchResult,
    SkillEndorsementResult SkillResult,
    ReputationUpdateResult ReputationResult,
    NotificationResult NotificationResult,
    RecommendationUpdateResult RecommendationResult,
    WorkflowStatus Status)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Smart match recommendations response
/// </summary>
public record SmartMatchRecommendationsResponse(
    List<IntelligentMatchRecommendation> Recommendations,
    MatchingInsights Insights,
    UserBehaviorAnalysis BehaviorAnalysis,
    DateTime GeneratedAt)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Batch match processing response
/// </summary>
public record BatchMatchProcessingResponse(
    int ProcessedUsers,
    int CreatedMatches,
    int SkippedUsers,
    List<BatchProcessingError> Errors,
    BatchProcessingStatistics Statistics,
    TimeSpan ProcessingTime)
{
    public string ApiVersion => "v1";
}

// Supporting DTOs
public record MatchCreationResult(
    bool Success,
    string? MatchId,
    string? ErrorMessage,
    MatchValidationDetails ValidationDetails);

public record UserNotificationResult(
    bool NotificationSent,
    List<string> NotificationTypes,
    List<string> FailedNotifications);

public record SkillValidationResult(
    bool IsValid,
    List<SkillValidationDetail> ValidationDetails,
    List<string> Suggestions);

public record AppointmentCreationResult(
    bool Success,
    string? AppointmentId,
    DateTime? ScheduledTime,
    string? MeetingLink,
    string? ErrorMessage);

public record WorkflowStatus(
    bool Success,
    string Stage,
    List<string> CompletedSteps,
    string? ErrorMessage);

public record MatchAcceptanceResult(
    bool Success,
    string MatchId,
    DateTime AcceptedAt,
    string NewStatus);

public record NotificationResult(
    bool Success,
    List<string> SentNotifications,
    List<string> FailedNotifications);

public record CalendarIntegrationResult(
    bool Success,
    string? CalendarEventId,
    List<string> IntegratedCalendars);

public record MatchCompletionResult(
    bool Success,
    string MatchId,
    DateTime CompletedAt,
    string FinalStatus);

public record SkillEndorsementResult(
    bool Success,
    List<string> EndorsedSkills,
    List<string> UpdatedProficiencyLevels);

public record ReputationUpdateResult(
    bool Success,
    double NewRating,
    int NewReviewCount,
    List<string> EarnedBadges);

public record RecommendationUpdateResult(
    bool Success,
    int UpdatedRecommendations,
    List<string> NewRecommendationTypes);

public record IntelligentMatchRecommendation(
    string TargetUserId,
    string TargetUserName,
    SkillMatchDetails SkillMatch,
    double CompatibilityScore,
    List<string> RecommendationReasons,
    MatchPredictionDetails Prediction,
    List<DateTime> OptimalMeetingTimes);

public record MatchingInsights(
    UserMatchingPattern UserPattern,
    SkillDemandAnalysis SkillDemand,
    SuccessFactorAnalysis SuccessFactors,
    TimePreferenceAnalysis TimePreferences);

public record UserBehaviorAnalysis(
    MatchingFrequency Frequency,
    PreferredSkillTypes SkillTypes,
    CommunicationStyle Communication,
    SuccessRate HistoricalSuccess);

public record BatchProcessingError(
    string UserId,
    string ErrorType,
    string Message,
    string? Suggestion);

public record BatchProcessingStatistics(
    TimeSpan AverageProcessingTimePerUser,
    double SuccessRate,
    Dictionary<string, int> ErrorBreakdown,
    int OptimalBatchSize);

public record MatchValidationDetails(
    bool SkillCompatibility,
    bool UserAvailability,
    bool GeographicCompatibility,
    double OverallScore);

public record SkillValidationDetail(
    string SkillId,
    bool Exists,
    bool UserHasSkill,
    string ProficiencyLevel,
    List<string> Issues);

public record SkillMatchDetails(
    string OfferedSkillId,
    string WantedSkillId,
    string SkillCategory,
    double SkillCompatibility,
    string ProficiencyGap);

public record MatchPredictionDetails(
    double SuccessProbability,
    string PredictedOutcome,
    List<string> RiskFactors,
    string ConfidenceLevel);

public record UserMatchingPattern(
    string PreferredMatchType,
    List<string> FavoriteSkillCategories,
    double AverageSessionLength,
    string TypicalResponseTime);

public record SkillDemandAnalysis(
    List<TrendingSkill> TrendingSkills,
    List<UnderservedSkill> UnderservedSkills,
    Dictionary<string, double> CategoryDemand);

public record SuccessFactorAnalysis(
    List<SuccessFactor> TopFactors,
    Dictionary<string, double> FactorWeights,
    string OptimalMatchingStrategy);

public record TimePreferenceAnalysis(
    Dictionary<string, double> PreferredTimeSlots,
    Dictionary<string, double> DayOfWeekPreferences,
    string OptimalSchedulingStrategy);

public record MatchingFrequency(
    double MatchesPerWeek,
    string ActivityLevel,
    List<string> PeakActivityPeriods);

public record PreferredSkillTypes(
    List<string> OfferedSkills,
    List<string> WantedSkills,
    List<string> EmergingInterests);

public record CommunicationStyle(
    string PreferredMethod,
    double ResponseRate,
    string TypicalMessageLength);

public record SuccessRate(
    double CompletionRate,
    double SatisfactionScore,
    List<string> SuccessPatterns);

public record MatchingCriteria(
    List<string> RequiredSkills,
    List<string> PreferredSkills,
    double MinCompatibilityScore,
    int MaxDistance,
    List<string> AvailableTimeSlots);

public record TrendingSkill(
    string SkillId,
    string Name,
    double TrendScore,
    string TrendDirection);

public record UnderservedSkill(
    string SkillId,
    string Name,
    double DemandSupplyRatio,
    int WaitingUsers);

public record SuccessFactor(
    string FactorName,
    double Impact,
    string Description);