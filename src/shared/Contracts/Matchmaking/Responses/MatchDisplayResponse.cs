namespace Contracts.Matchmaking.Responses;

/// <summary>
/// Display-focused match response - contains all data needed for UI
/// </summary>
public record MatchDisplayResponse(
    string Id,
    string SkillId,
    string SkillName,
    string SkillCategory,
    string Status, // pending, accepted, rejected, completed, cancelled

    // Partner info
    string PartnerId,
    string PartnerName,
    decimal PartnerRating,
    string? PartnerAvatar,

    // Match details
    bool IsOffering, // Am I offering this skill?
    decimal? CompatibilityScore,

    // Exchange info (from AcceptedMatchRequest)
    bool IsSkillExchange,
    string? ExchangeSkillId,
    string? ExchangeSkillName,

    // Monetary info
    bool IsMonetary,
    decimal? OfferedAmount,
    string? Currency,

    // Session info
    SessionInfoResponse? SessionInfo,

    // Preferences
    bool IsLearningMode,
    string[] PreferredDays,
    string[] PreferredTimes,
    string? AdditionalNotes,

    // Chat/Thread info - ThreadId from MatchRequest for Chat integration
    string? ThreadId,
    string? MatchRequestId,

    // Timestamps
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt
)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Session progress information
/// </summary>
public record SessionInfoResponse(
    int CompletedSessions,
    int TotalSessions,
    DateTime? NextSessionDate
);
