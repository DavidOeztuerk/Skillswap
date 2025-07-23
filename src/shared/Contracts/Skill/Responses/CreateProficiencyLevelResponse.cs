namespace Contracts.Skill.Responses;

/// <summary>
/// API response for CreateProficiencyLevel operation
/// </summary>
public record CreateProficiencyLevelResponse(
    string LevelId,
    string Level,
    int Rank,
    DateTime CreatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
