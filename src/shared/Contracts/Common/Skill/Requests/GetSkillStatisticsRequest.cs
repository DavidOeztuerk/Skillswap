using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving skill statistics with filtering options
/// </summary>
/// <param name="FromDate">Start date for statistics range (optional)</param>
/// <param name="ToDate">End date for statistics range (optional)</param>
/// <param name="CategoryId">Filter by skill category identifier</param>
/// <param name="UserId">Filter by specific user identifier</param>
public record GetSkillStatisticsRequest(
    DateTime? FromDate = null,
    
    DateTime? ToDate = null,
    
    string? CategoryId = null,
    
    string? UserId = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
