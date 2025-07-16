using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving a learning path for a target skill
/// </summary>
/// <param name="TargetSkillId">Target skill identifier to generate learning path for</param>
/// <param name="CurrentSkillLevel">Current skill level of the user</param>
/// <param name="MaxSteps">Maximum number of steps in the learning path</param>
public record GetSkillLearningPathRequest(
    [Required(ErrorMessage = "Target skill ID is required")]
    string TargetSkillId,
    
    string? CurrentSkillLevel = null,
    
    [Range(1, 20, ErrorMessage = "Max steps must be between 1 and 20")]
    int MaxSteps = 10)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
