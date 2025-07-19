using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving detailed analytics for a specific skill
/// </summary>
/// <param name="SkillId">Skill identifier to get analytics for</param>
/// <param name="FromDate">Start date for analytics range</param>
/// <param name="ToDate">End date for analytics range</param>
public record GetSkillAnalyticsRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,
    
    DateTime? FromDate = null,
    
    DateTime? ToDate = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
