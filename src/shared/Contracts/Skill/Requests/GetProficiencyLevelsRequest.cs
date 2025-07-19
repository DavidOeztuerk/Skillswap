using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving proficiency levels
/// </summary>
/// <param name="IncludeInactive">Whether to include inactive proficiency levels in the result</param>
/// <param name="IncludeSkillCounts">Whether to include skill counts for each proficiency level</param>
public record GetProficiencyLevelsRequest(
    bool IncludeInactive = false,
    bool IncludeSkillCounts = false)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
