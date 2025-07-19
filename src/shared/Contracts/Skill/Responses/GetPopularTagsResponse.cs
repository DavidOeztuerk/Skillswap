namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetPopularTags operation
/// </summary>
/// <param name="PopularTags">List of popular tags</param>
/// <param name="TotalCount">Total number of tags</param>
/// <param name="CategoryFilter">Category filter applied</param>
/// <param name="MinUsageCount">Minimum usage count filter</param>
public record GetPopularTagsResponse(
    List<PopularTagResponse> PopularTags,
    int TotalCount,
    string? CategoryFilter,
    int MinUsageCount)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Popular tag response
/// </summary>
/// <param name="Tag">Tag name</param>
/// <param name="UsageCount">Number of times the tag is used</param>
/// <param name="CategoryId">Category ID if tag is associated with a category</param>
/// <param name="CategoryName">Category name if tag is associated with a category</param>
/// <param name="GrowthRate">Growth rate of the tag usage</param>
public record PopularTagResponse(
    string Tag,
    int UsageCount,
    string? CategoryId,
    string? CategoryName,
    double GrowthRate);
