namespace Contracts.Skill.Responses;

/// <summary>
/// API response for DeleteSkill operation
/// </summary>
public record DeleteSkillResponse(
    string SkillId,
    bool Success,
    DateTime DeletedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
