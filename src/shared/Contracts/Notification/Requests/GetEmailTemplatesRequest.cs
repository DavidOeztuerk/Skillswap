using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for getting email templates
/// </summary>
/// <param name="Language">Filter by language</param>
/// <param name="IsActive">Filter by active status</param>
/// <param name="Page">Page number (1-based)</param>
/// <param name="PageSize">Number of items per page</param>
public record GetEmailTemplatesRequest(
    [StringLength(10, ErrorMessage = "Language must not exceed 10 characters")]
    string? Language = null,
    
    bool? IsActive = null,
    
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
    int Page = 1,
    
    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    int PageSize = 20) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
    
    /// <summary>
    /// Calculates the number of items to skip
    /// </summary>
    public int Skip => (Page - 1) * PageSize;
    
    /// <summary>
    /// Gets the number of items to take
    /// </summary>
    public int Take => PageSize;
}
