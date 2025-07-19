namespace Contracts.Skill.Responses;

/// <summary>
/// API response for RateSkill operation
/// </summary>
public record RateSkillResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
