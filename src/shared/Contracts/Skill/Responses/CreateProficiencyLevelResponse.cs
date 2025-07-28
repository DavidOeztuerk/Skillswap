using Contracts.Common;

namespace Contracts.Skill.Responses;

/// <summary>
/// API response for CreateProficiencyLevel operation
/// </summary>
public record CreateProficiencyLevelResponse(
    string LevelId,
    string Level,
    int Rank,
    string? Color,
    DateTime CreatedAt) : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
