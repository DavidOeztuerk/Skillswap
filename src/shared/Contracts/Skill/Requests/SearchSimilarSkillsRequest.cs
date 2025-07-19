using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for searching skills similar to a given skill
/// </summary>
/// <param name="SkillId">Skill identifier to find similar skills for</param>
/// <param name="MaxResults">Maximum number of similar skills to return</param>
/// <param name="MinSimilarityScore">Minimum similarity score for results</param>
public record SearchSimilarSkillsRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,
    
    [Range(1, 50, ErrorMessage = "Max results must be between 1 and 50")]
    int MaxResults = 10,
    
    [Range(0.0, 1.0, ErrorMessage = "Min similarity score must be between 0 and 1")]
    double MinSimilarityScore = 0.5)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
