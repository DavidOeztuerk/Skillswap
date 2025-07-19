namespace Contracts.Skill.Responses;

/// <summary>
/// API response for DeleteSkill operation
/// </summary>
public record DeleteSkillResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
