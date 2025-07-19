namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillReviews operation
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Reviews">List of skill reviews</param>
/// <param name="TotalCount">Total number of reviews</param>
/// <param name="PageNumber">Current page number</param>
/// <param name="PageSize">Page size used</param>
/// <param name="HasNextPage">Whether there are more pages</param>
/// <param name="AverageRating">Average rating across all reviews</param>
/// <param name="RatingDistribution">Distribution of ratings (1-5 stars)</param>
public record GetSkillReviewsResponse(
    string SkillId,
    List<SkillReviewResponse> Reviews,
    int TotalCount,
    int PageNumber,
    int PageSize,
    bool HasNextPage,
    double AverageRating,
    Dictionary<int, int> RatingDistribution)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
