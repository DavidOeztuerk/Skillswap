namespace Contracts.Skill.Responses;

/// <summary>
/// API response for SearchSimilarSkills operation
/// </summary>
/// <param name="OriginalSkillId">Unique identifier for the original skill</param>
/// <param name="SimilarSkills">List of similar skills</param>
/// <param name="TotalCount">Total number of similar skills found</param>
/// <param name="SearchCriteria">Search criteria used</param>
/// <param name="SearchPerformedAt">When the search was performed</param>
public record SearchSimilarSkillsResponse(
    string OriginalSkillId,
    List<SimilarSkillResponse> SimilarSkills,
    int TotalCount,
    SimilarSkillSearchCriteria SearchCriteria,
    DateTime SearchPerformedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Similar skill response
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="UserId">User ID who offers the skill</param>
/// <param name="UserName">Name of the user who offers the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Description of the skill</param>
/// <param name="Category">Skill category information</param>
/// <param name="SimilarityScore">Similarity score (0-1)</param>
/// <param name="CommonTags">Tags common with the original skill</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="IsRemoteAvailable">Whether remote learning is available</param>
public record SimilarSkillResponse(
    string SkillId,
    string UserId,
    string UserName,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    double SimilarityScore,
    List<string> CommonTags,
    double? AverageRating,
    bool IsRemoteAvailable);

/// <summary>
/// Similar skill search criteria
/// </summary>
/// <param name="OriginalSkillId">Original skill ID used for comparison</param>
/// <param name="MaxResults">Maximum number of results requested</param>
/// <param name="MinSimilarityScore">Minimum similarity score threshold</param>
public record SimilarSkillSearchCriteria(
    string OriginalSkillId,
    int MaxResults,
    double MinSimilarityScore);
