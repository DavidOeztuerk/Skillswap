using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving skill recommendations for a user
/// </summary>
/// <param name="UserId">User identifier to get recommendations for</param>
/// <param name="MaxRecommendations">Maximum number of recommendations to return</param>
/// <param name="OnlyRemote">Whether to only include remote-available skills</param>
/// <param name="PreferredLocation">Preferred location for skill exchange</param>
public record GetSkillRecommendationsRequest(
    [Required(ErrorMessage = "User ID is required")]
    string UserId,
    
    [Range(1, 50, ErrorMessage = "Max recommendations must be between 1 and 50")]
    int MaxRecommendations = 10,
    
    bool OnlyRemote = false,
    
    [StringLength(200, ErrorMessage = "Preferred location must not exceed 200 characters")]
    string? PreferredLocation = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
