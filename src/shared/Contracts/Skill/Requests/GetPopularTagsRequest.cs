using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving popular tags with filtering options
/// </summary>
/// <param name="CategoryId">Filter by skill category identifier</param>
/// <param name="MaxTags">Maximum number of tags to return</param>
/// <param name="MinUsageCount">Minimum usage count for tags</param>
public record GetPopularTagsRequest(
    string? CategoryId = null,
    
    [Range(1, 200, ErrorMessage = "Max tags must be between 1 and 200")]
    int MaxTags = 50,
    
    [Range(1, int.MaxValue, ErrorMessage = "Min usage count must be at least 1")]
    int MinUsageCount = 1)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
