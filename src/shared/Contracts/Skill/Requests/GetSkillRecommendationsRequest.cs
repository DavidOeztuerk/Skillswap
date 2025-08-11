using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving skill recommendations for a user
/// </summary>
/// <param name="UserId">User identifier to get recommendations for</param>
/// <param name="MaxRecommendations">Maximum number of recommendations to return</param>
public record GetSkillRecommendationsRequest(
    [Required(ErrorMessage = "User ID is required")]
    string UserId,

    [Range(1, 50, ErrorMessage = "Max recommendations must be between 1 and 50")]
    int MaxRecommendations = 10)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
