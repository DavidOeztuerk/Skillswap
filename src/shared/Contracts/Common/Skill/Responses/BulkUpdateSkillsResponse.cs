namespace Contracts.Skill.Responses;

/// <summary>
/// API response for BulkUpdateSkills operation
/// </summary>
/// <param name="UpdatedCount">Number of skills successfully updated</param>
/// <param name="FailedCount">Number of skills that failed to update</param>
/// <param name="FailedSkillIds">List of skill IDs that failed to update</param>
/// <param name="UpdatedSkills">List of successfully updated skills</param>
/// <param name="FailedSkills">List of failed skills with error messages</param>
/// <param name="UpdateDuration">Total time taken for the bulk update</param>
public record BulkUpdateSkillsResponse(
    int UpdatedCount,
    int FailedCount,
    List<string> FailedSkillIds,
    List<BulkUpdatedSkillResponse> UpdatedSkills,
    List<BulkFailedSkillResponse> FailedSkills,
    TimeSpan UpdateDuration)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Bulk updated skill response
/// </summary>
/// <param name="SkillId">Unique identifier for the updated skill</param>
/// <param name="Name">Name of the updated skill</param>
/// <param name="UpdatesApplied">List of updates that were applied</param>
public record BulkUpdatedSkillResponse(
    string SkillId,
    string Name,
    List<string> UpdatesApplied);

/// <summary>
/// Bulk failed skill response
/// </summary>
/// <param name="SkillId">Unique identifier for the failed skill</param>
/// <param name="Name">Name of the failed skill</param>
/// <param name="ErrorMessage">Error message for the failure</param>
public record BulkFailedSkillResponse(
    string SkillId,
    string Name,
    string ErrorMessage);
