namespace Contracts.Skill.Responses;

/// <summary>
/// API response for EndorseSkill operation
/// </summary>
public record EndorseSkillResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
