namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillLearningPath operation
/// </summary>
/// <param name="TargetSkillId">Unique identifier for the target skill</param>
/// <param name="TargetSkillName">Name of the target skill</param>
/// <param name="Steps">List of learning steps</param>
/// <param name="EstimatedTotalHours">Estimated total hours to complete the path</param>
/// <param name="DifficultyLevel">Overall difficulty level of the learning path</param>
/// <param name="PathGeneratedAt">When the learning path was generated</param>
public record GetSkillLearningPathResponse(
    string TargetSkillId,
    string TargetSkillName,
    List<LearningStepResponse> Steps,
    int EstimatedTotalHours,
    string DifficultyLevel,
    DateTime PathGeneratedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Learning step response
/// </summary>
/// <param name="StepNumber">Step number in the learning path</param>
/// <param name="SkillId">Unique identifier for the skill in this step</param>
/// <param name="SkillName">Name of the skill in this step</param>
/// <param name="Description">Description of what to learn in this step</param>
/// <param name="RequiredProficiencyLevel">Required proficiency level for this step</param>
/// <param name="EstimatedHours">Estimated hours to complete this step</param>
/// <param name="Prerequisites">List of prerequisite skills</param>
/// <param name="Resources">List of learning resources</param>
public record LearningStepResponse(
    int StepNumber,
    string SkillId,
    string SkillName,
    string Description,
    string RequiredProficiencyLevel,
    int EstimatedHours,
    List<string> Prerequisites,
    List<LearningResourceResponse> Resources);

/// <summary>
/// Learning resource response
/// </summary>
/// <param name="ResourceId">Unique identifier for the resource</param>
/// <param name="Title">Title of the resource</param>
/// <param name="Type">Type of resource (Course, Tutorial, Book, etc.)</param>
/// <param name="Url">URL of the resource</param>
/// <param name="Rating">Rating of the resource</param>
/// <param name="Duration">Duration in minutes</param>
/// <param name="IsFree">Whether the resource is free</param>
/// <param name="Provider">Provider of the resource</param>
public record LearningResourceResponse(
    string ResourceId,
    string Title,
    string Type,
    string? Url,
    double? Rating,
    int? Duration,
    bool IsFree,
    string? Provider);
