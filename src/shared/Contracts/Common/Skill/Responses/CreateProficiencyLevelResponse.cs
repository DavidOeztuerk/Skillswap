namespace Contracts.Skill.Responses;

/// <summary>
/// API response for CreateProficiencyLevel operation
/// </summary>
public record CreateProficiencyLevelResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
