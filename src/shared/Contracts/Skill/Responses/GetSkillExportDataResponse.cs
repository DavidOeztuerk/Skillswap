namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillExportData operation
/// </summary>
/// <param name="Skills">List of skills to export</param>
/// <param name="Metadata">Export metadata information</param>
/// <param name="ExportFormat">Format of the exported data</param>
/// <param name="ExportSize">Size of the exported data in bytes</param>
public record GetSkillExportDataResponse(
    List<SkillExportItem> Skills,
    SkillExportMetadata Metadata,
    string ExportFormat,
    long ExportSize)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Skill export item
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="UserId">User ID who owns the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Description of the skill</param>
/// <param name="IsOffering">Whether the skill is being offered</param>
/// <param name="CategoryName">Name of the skill category</param>
/// <param name="ProficiencyLevelName">Name of the proficiency level</param>
/// <param name="Tags">Associated tags for the skill</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="ReviewCount">Number of reviews for the skill</param>
/// <param name="CreatedAt">When the skill was created</param>
/// <param name="Reviews">List of reviews if included</param>
public record SkillExportItem(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    bool IsOffering,
    string CategoryName,
    string ProficiencyLevelName,
    List<string> Tags,
    double? AverageRating,
    int ReviewCount,
    DateTime CreatedAt,
    List<SkillReviewResponse>? Reviews);

/// <summary>
/// Skill export metadata
/// </summary>
/// <param name="TotalRecords">Total number of records exported</param>
/// <param name="ExportedAt">When the export was performed</param>
/// <param name="ExportedBy">User who performed the export</param>
/// <param name="Filters">Filters applied during export</param>
/// <param name="ExportDuration">Time taken for the export</param>
public record SkillExportMetadata(
    int TotalRecords,
    DateTime ExportedAt,
    string ExportedBy,
    Dictionary<string, object> Filters,
    TimeSpan ExportDuration);

/// <summary>
/// Skill review response for export
/// </summary>
/// <param name="ReviewId">Unique identifier for the review</param>
/// <param name="ReviewerUserId">User ID who wrote the review</param>
/// <param name="Rating">Rating given (1-5)</param>
/// <param name="Comment">Review comment</param>
/// <param name="Tags">Tags associated with the review</param>
/// <param name="CreatedAt">When the review was created</param>
public record SkillReviewResponse(
    string ReviewId,
    string ReviewerUserId,
    int Rating,
    string? Comment,
    List<string> Tags,
    DateTime CreatedAt);
