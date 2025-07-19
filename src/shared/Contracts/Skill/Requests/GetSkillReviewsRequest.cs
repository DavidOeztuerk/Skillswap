using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving skill reviews with filtering and pagination
/// </summary>
/// <param name="SkillId">Skill identifier to get reviews for</param>
/// <param name="MinRating">Minimum rating filter</param>
/// <param name="SortBy">Sort order for reviews (newest, oldest, rating_high, rating_low, helpful)</param>
/// <param name="PageNumber">Page number for pagination</param>
/// <param name="PageSize">Page size for pagination</param>
public record GetSkillReviewsRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,
    
    [Range(1, 5, ErrorMessage = "Min rating must be between 1 and 5")]
    int? MinRating = null,
    
    [RegularExpression("^(newest|oldest|rating_high|rating_low|helpful)$", ErrorMessage = "Sort by must be newest, oldest, rating_high, rating_low, or helpful")]
    string? SortBy = "newest",
    
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
    int PageNumber = 1,
    
    [Range(1, 50, ErrorMessage = "Page size must be between 1 and 50")]
    int PageSize = 10)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
