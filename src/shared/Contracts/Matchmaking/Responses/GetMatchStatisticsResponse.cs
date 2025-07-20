namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for match statistics
/// </summary>
public record GetMatchStatisticsResponse(
    int TotalMatches,
    int ActiveMatches,
    int CompletedMatches,
    double SuccessRate,
    double AverageCompatibilityScore,
    Dictionary<string, int> MatchesByCategory,
    List<TrendingMatchCategory> TrendingCategories,
    TimeSpan AverageMatchDuration)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record TrendingMatchCategory(
    string CategoryId,
    string CategoryName,
    int MatchCount,
    double GrowthRate);
