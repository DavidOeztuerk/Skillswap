namespace Contracts.Skill.Responses;

/// <summary>
/// API response for ValidateSkillName operation
/// </summary>
/// <param name="SkillName">The skill name being validated</param>
/// <param name="IsAvailable">Whether the skill name is available</param>
/// <param name="IsSimilarToExisting">Whether the skill name is similar to existing ones</param>
/// <param name="SimilarSkillNames">List of similar skill names</param>
/// <param name="Suggestions">List of suggested alternative names</param>
/// <param name="ValidationResult">Overall validation result</param>
public record ValidateSkillNameResponse(
    string SkillName,
    bool IsAvailable,
    bool IsSimilarToExisting,
    List<string> SimilarSkillNames,
    List<string> Suggestions,
    SkillNameValidationResult ValidationResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Skill name validation result
/// </summary>
/// <param name="IsValid">Whether the skill name is valid</param>
/// <param name="ErrorMessage">Error message if validation failed</param>
/// <param name="WarningMessage">Warning message if there are concerns</param>
public record SkillNameValidationResult(
    bool IsValid,
    string? ErrorMessage,
    string? WarningMessage);
