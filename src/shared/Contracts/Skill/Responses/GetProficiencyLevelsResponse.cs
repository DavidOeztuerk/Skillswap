using Contracts.Common;

namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetProficiencyLevels operation
/// </summary>
/// <param name="ProficiencyLevels">List of proficiency levels</param>
/// <param name="TotalCount">Total number of proficiency levels</param>
/// <param name="IncludeInactive">Whether inactive levels were included</param>
/// <param name="IncludeSkillCounts">Whether skill counts were included</param>
public record GetProficiencyLevelsResponse(
    List<ProficiencyLevelResponse> ProficiencyLevels)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
