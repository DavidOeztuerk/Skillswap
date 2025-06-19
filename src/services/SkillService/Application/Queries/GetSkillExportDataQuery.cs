using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// GET SKILL EXPORT DATA QUERY (Admin/Owner)
// ============================================================================

public record GetSkillExportDataQuery(
    string? UserId = null,
    string? CategoryId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool IncludeReviews = false,
    string ExportFormat = "json") 
    : IQuery<SkillExportDataResponse>
{
    // No caching for export operations
}

public record SkillExportDataResponse(
    List<SkillExportItem> Skills,
    SkillExportMetadata Metadata);

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

public record SkillExportMetadata(
    int TotalRecords,
    DateTime ExportedAt,
    string ExportedBy,
    Dictionary<string, object> Filters);

public class GetSkillExportDataQueryValidator : AbstractValidator<GetSkillExportDataQuery>
{
    public GetSkillExportDataQueryValidator()
    {
        RuleFor(x => x.ExportFormat)
            .Must(BeValidExportFormat).WithMessage("Invalid export format");

        RuleFor(x => x)
            .Must(x => x.FromDate == null || x.ToDate == null || x.FromDate <= x.ToDate)
            .WithMessage("FromDate must be before or equal to ToDate");
    }

    private static bool BeValidExportFormat(string format)
    {
        var validFormats = new[] { "json", "csv", "xml" };
        return validFormats.Contains(format.ToLowerInvariant());
    }
}
