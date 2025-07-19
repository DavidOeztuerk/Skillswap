namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillStatistics operation
/// </summary>
/// <param name="TotalSkills">Total number of skills</param>
/// <param name="OfferedSkills">Number of skills being offered</param>
/// <param name="RequestedSkills">Number of skills being requested</param>
/// <param name="ActiveSkills">Number of active skills</param>
/// <param name="AverageRating">Average rating across all skills</param>
/// <param name="SkillsByCategory">Skills grouped by category</param>
/// <param name="SkillsByProficiencyLevel">Skills grouped by proficiency level</param>
/// <param name="TopRatedSkills">Top rated skills</param>
/// <param name="TrendingSkills">Trending skills</param>
/// <param name="PopularTags">Popular tags with usage counts</param>
public record GetSkillStatisticsResponse(
    int TotalSkills,
    int OfferedSkills,
    int RequestedSkills,
    int ActiveSkills,
    double AverageRating,
    Dictionary<string, int> SkillsByCategory,
    Dictionary<string, int> SkillsByProficiencyLevel,
    List<TopSkillResponse> TopRatedSkills,
    List<TrendingSkillResponse> TrendingSkills,
    Dictionary<string, int> PopularTags)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Top skill response
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="ReviewCount">Number of reviews for the skill</param>
public record TopSkillResponse(
    string SkillId,
    string Name,
    double AverageRating,
    int ReviewCount);

/// <summary>
/// Trending skill response
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="CategoryName">Name of the skill category</param>
/// <param name="RecentViews">Number of recent views</param>
/// <param name="GrowthPercentage">Growth percentage</param>
public record TrendingSkillResponse(
    string SkillId,
    string Name,
    string CategoryName,
    int RecentViews,
    int GrowthPercentage);
