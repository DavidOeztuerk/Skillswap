using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// GET SKILL ANALYTICS QUERY (Admin/Owner)
// ============================================================================

public record GetSkillAnalyticsQuery(
    string SkillId,
    DateTime? FromDate = null,
    DateTime? ToDate = null)
    : IQuery<SkillAnalyticsResponse>, ICacheableQuery
{
    public string CacheKey => $"skill-analytics:{SkillId}:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record SkillAnalyticsResponse(
    string SkillId,
    string Name,
    SkillViewAnalytics ViewAnalytics,
    SkillRatingAnalytics RatingAnalytics,
    SkillMatchAnalytics MatchAnalytics,
    List<SkillPerformanceMetric> PerformanceMetrics);

public record SkillViewAnalytics(
    int TotalViews,
    int UniqueViews,
    double AverageViewDuration,
    List<DailyViewCount> DailyViews,
    Dictionary<string, int> ViewsBySource);

public record SkillRatingAnalytics(
    double AverageRating,
    int TotalRatings,
    Dictionary<int, int> RatingDistribution,
    List<string> CommonTags,
    double SentimentScore);

public record SkillMatchAnalytics(
    int TotalMatches,
    int SuccessfulMatches,
    double MatchSuccessRate,
    double AverageResponseTime,
    List<string> PopularMatchReasons);

public record SkillPerformanceMetric(
    string MetricName,
    double Value,
    string Unit,
    double ChangePercentage,
    string Trend);

public record DailyViewCount(
    DateTime Date,
    int Views,
    int UniqueViews);

public class GetSkillAnalyticsQueryValidator : AbstractValidator<GetSkillAnalyticsQuery>
{
    public GetSkillAnalyticsQueryValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x)
            .Must(x => x.FromDate == null || x.ToDate == null || x.FromDate <= x.ToDate)
            .WithMessage("FromDate must be before or equal to ToDate");
    }
}
