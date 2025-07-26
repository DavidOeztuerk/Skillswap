using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving user skills with filtering and pagination
/// </summary>
/// <param name="IsOffering">Filter by whether skills are offered (null for all)</param>
/// <param name="CategoryId">Filter by skill category identifier</param>
/// <param name="IncludeInactive">Whether to include inactive skills</param>
/// <param name="PageNumber">Page number for pagination</param>
/// <param name="PageSize">Page size for pagination</param>
public record GetUserSkillsRequest(
    bool? IsOffering = null,
    
    string? CategoryId = null,
    
    bool IncludeInactive = false,
    
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
    int PageNumber = 1,
    
    [Range(1, 50, ErrorMessage = "Page size must be between 1 and 50")]
    int PageSize = 20)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
