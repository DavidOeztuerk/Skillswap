using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving skill details
/// </summary>
/// <param name="SkillId">ID of the skill to retrieve</param>
public record GetSkillDetailsRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
