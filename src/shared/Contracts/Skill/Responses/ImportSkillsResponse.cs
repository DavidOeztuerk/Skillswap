namespace Contracts.Skill.Responses;

/// <summary>
/// API response for ImportSkills operation
/// </summary>
/// <param name="ImportedCount">Number of skills successfully imported</param>
/// <param name="SkippedCount">Number of skills skipped (duplicates or invalid)</param>
/// <param name="FailedCount">Number of skills that failed to import</param>
/// <param name="ValidationErrors">List of validation errors encountered</param>
/// <param name="ImportedSkills">List of successfully imported skills</param>
/// <param name="SkippedSkills">List of skipped skills with reasons</param>
/// <param name="FailedSkills">List of failed skills with error messages</param>
/// <param name="ImportDuration">Total time taken for import</param>
public record ImportSkillsResponse(
    int ImportedCount,
    int SkippedCount,
    int FailedCount,
    List<string> ValidationErrors,
    List<ImportedSkillResponse> ImportedSkills,
    List<SkippedSkillResponse> SkippedSkills,
    List<FailedSkillResponse> FailedSkills,
    TimeSpan ImportDuration)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Imported skill response
/// </summary>
/// <param name="SkillId">Unique identifier for the imported skill</param>
/// <param name="Name">Name of the imported skill</param>
/// <param name="CategoryName">Category of the imported skill</param>
/// <param name="ProficiencyLevelName">Proficiency level of the imported skill</param>
public record ImportedSkillResponse(
    string SkillId,
    string Name,
    string CategoryName,
    string ProficiencyLevelName);

/// <summary>
/// Skipped skill response
/// </summary>
/// <param name="Name">Name of the skipped skill</param>
/// <param name="Reason">Reason for skipping</param>
public record SkippedSkillResponse(
    string Name,
    string Reason);

/// <summary>
/// Failed skill response
/// </summary>
/// <param name="Name">Name of the failed skill</param>
/// <param name="ErrorMessage">Error message for the failure</param>
public record FailedSkillResponse(
    string Name,
    string ErrorMessage);
