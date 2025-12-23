using CQRS.Interfaces;

namespace VideocallService.Application.Queries;

public record GetCallStatisticsQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IQuery<CallStatisticsResponse>, ICacheableQuery
{
    public string CacheKey => $"call-statistics:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(15);
}

public record CallStatisticsResponse(
    int TotalCalls,
    int CompletedCalls,
    int CancelledCalls,
    double AverageDurationMinutes,
    double CompletionRate,
    int TotalParticipants,
    int UniqueUsers,
    Dictionary<string, int> CallsByHour,
    List<CallQualityMetric> QualityMetrics);

public record CallQualityMetric(
    string MetricName,
    double Value,
    string Unit);
