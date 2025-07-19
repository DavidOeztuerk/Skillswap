namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillAnalytics operation
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="ViewAnalytics">View analytics for the skill</param>
/// <param name="RatingAnalytics">Rating analytics for the skill</param>
/// <param name="MatchAnalytics">Match analytics for the skill</param>
/// <param name="PerformanceMetrics">Performance metrics for the skill</param>
/// <param name="AnalyticsGeneratedAt">When the analytics were generated</param>
public record GetSkillAnalyticsResponse(
    string SkillId,
    string Name,
    SkillViewAnalytics ViewAnalytics,
    SkillRatingAnalytics RatingAnalytics,
    SkillMatchAnalytics MatchAnalytics,
    List<SkillPerformanceMetric> PerformanceMetrics,
    DateTime AnalyticsGeneratedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Skill view analytics
/// </summary>
/// <param name="TotalViews">Total number of views</param>
/// <param name="UniqueViews">Number of unique views</param>
/// <param name="AverageViewDuration">Average view duration in seconds</param>
/// <param name="DailyViews">Daily view breakdown</param>
/// <param name="ViewsBySource">Views grouped by source</param>
public record SkillViewAnalytics(
    int TotalViews,
    int UniqueViews,
    double AverageViewDuration,
    List<DailyViewCount> DailyViews,
    Dictionary<string, int> ViewsBySource);

/// <summary>
/// Skill rating analytics
/// </summary>
/// <param name="AverageRating">Average rating</param>
/// <param name="TotalRatings">Total number of ratings</param>
/// <param name="RatingDistribution">Rating distribution (1-5 stars)</param>
/// <param name="CommonTags">Common tags used in reviews</param>
/// <param name="SentimentScore">Sentiment score of reviews</param>
public record SkillRatingAnalytics(
    double AverageRating,
    int TotalRatings,
    Dictionary<int, int> RatingDistribution,
    List<string> CommonTags,
    double SentimentScore);

/// <summary>
/// Skill match analytics
/// </summary>
/// <param name="TotalMatches">Total number of matches</param>
/// <param name="SuccessfulMatches">Number of successful matches</param>
/// <param name="MatchSuccessRate">Match success rate percentage</param>
/// <param name="AverageResponseTime">Average response time in hours</param>
/// <param name="PopularMatchReasons">Popular reasons for matches</param>
public record SkillMatchAnalytics(
    int TotalMatches,
    int SuccessfulMatches,
    double MatchSuccessRate,
    double AverageResponseTime,
    List<string> PopularMatchReasons);

/// <summary>
/// Skill performance metric
/// </summary>
/// <param name="MetricName">Name of the metric</param>
/// <param name="Value">Metric value</param>
/// <param name="Unit">Unit of measurement</param>
/// <param name="ChangePercentage">Change percentage from previous period</param>
/// <param name="Trend">Trend direction (up, down, stable)</param>
public record SkillPerformanceMetric(
    string MetricName,
    double Value,
    string Unit,
    double ChangePercentage,
    string Trend);

/// <summary>
/// Daily view count
/// </summary>
/// <param name="Date">Date of the views</param>
/// <param name="Views">Number of views</param>
/// <param name="UniqueViews">Number of unique views</param>
public record DailyViewCount(
    DateTime Date,
    int Views,
    int UniqueViews);
