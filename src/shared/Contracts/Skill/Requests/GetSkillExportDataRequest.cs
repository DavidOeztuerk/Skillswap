using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for exporting skill data with filtering options
/// </summary>
/// <param name="UserId">Filter by specific user ID</param>
/// <param name="CategoryId">Filter by skill category ID</param>
/// <param name="FromDate">Start date for export range</param>
/// <param name="ToDate">End date for export range</param>
/// <param name="IncludeReviews">Whether to include reviews in export</param>
/// <param name="ExportFormat">Export format (json, csv, xml)</param>
public record GetSkillExportDataRequest(
    string? UserId = null,
    
    string? CategoryId = null,
    
    DateTime? FromDate = null,
    
    DateTime? ToDate = null,
    
    bool IncludeReviews = false,
    
    [RegularExpression("^(json|csv|xml)$", ErrorMessage = "Export format must be json, csv, or xml")]
    string ExportFormat = "json")
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
