namespace Contracts.Skill.Responses;

/// <summary>
/// API response for RateSkill operation
/// </summary>
public record RateSkillResponse(
    string RatingId,
    int Rating,
    double NewAverageRating,
    int TotalRatings)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
