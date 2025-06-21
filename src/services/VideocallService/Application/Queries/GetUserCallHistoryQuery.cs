using CQRS.Interfaces;

namespace VideocallService.Application.Queries;

public record GetUserCallHistoryQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 20) : IPagedQuery<UserCallHistoryResponse>, ICacheableQuery
{
    int IPagedQuery<UserCallHistoryResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<UserCallHistoryResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"user-call-history:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}:{Status}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record UserCallHistoryResponse(
    string SessionId,
    string OtherParticipantName,
    string Status,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? EndedAt,
    int? DurationMinutes,
    bool WasInitiator);
