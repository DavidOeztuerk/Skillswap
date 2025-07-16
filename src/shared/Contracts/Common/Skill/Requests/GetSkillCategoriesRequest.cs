using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving skill categories
/// </summary>
/// <param name="IncludeInactive">Whether to include inactive skill categories in the result</param>
/// <param name="IncludeSkillCounts">Whether to include skill counts for each category</param>
public record GetSkillCategoriesRequest(
    bool IncludeInactive = false,
    bool IncludeSkillCounts = false)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
