namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillRecommendations operation
/// </summary>
/// <param name="Recommendations">List of skill recommendations</param>
/// <param name="TotalCount">Total number of recommendations</param>
/// <param name="RecommendationCriteria">Criteria used for recommendations</param>
/// <param name="GeneratedAt">When recommendations were generated</param>
public record GetSkillRecommendationsResponse(
    List<SkillRecommendationResponse> Recommendations,
    int TotalCount,
    RecommendationCriteriaResponse RecommendationCriteria,
    DateTime GeneratedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Skill recommendation response
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="UserId">User ID who offers the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Description of the skill</param>
/// <param name="Category">Skill category information</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="RecommendationReason">Reason for recommendation</param>
/// <param name="CompatibilityScore">Compatibility score (0-1)</param>
public record SkillRecommendationResponse(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    double? AverageRating,
    string RecommendationReason,
    double CompatibilityScore);

/// <summary>
/// Recommendation criteria response
/// </summary>
/// <param name="UserId">User ID for whom recommendations were generated</param>
/// <param name="MaxRecommendations">Maximum number of recommendations requested</param>
public record RecommendationCriteriaResponse(
    string UserId,
    int MaxRecommendations);
