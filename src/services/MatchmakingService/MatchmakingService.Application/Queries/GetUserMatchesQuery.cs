using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetUserMatchesQuery(
    string UserId,
    string? Status = null,
    bool IncludeCompleted = true,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<UserMatchResponse>
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;
}

public record UserMatchResponse(
    string Id,
    string SkillId,
    string SkillName,
    string SkillCategory,
    string Status,
    string PartnerId,
    string PartnerName,
    double PartnerRating,
    string? PartnerAvatar,
    string RequesterId,
    string ResponderId,
    bool IsSkillExchange,
    string? ExchangeSkillId,
    string? ExchangeSkillName,
    bool IsMonetary,
    decimal? OfferedAmount,
    string? Currency,
    bool IsOffering,
    double? CompatibilityScore,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt,
    bool IsLearningMode,
    string[] PreferredDays,
    string[] PreferredTimes,
    SessionInfoResponse? SessionInfo,
    string? AdditionalNotes,
    // Chat/Thread info - ThreadId from MatchRequest for Chat integration
    string? ThreadId = null,
    string? MatchRequestId = null);

public record SessionInfoResponse(
    int CompletedSessions,
    int TotalSessions,
    DateTime? NextSessionDate);
