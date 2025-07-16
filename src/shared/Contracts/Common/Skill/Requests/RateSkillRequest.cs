using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for rating a skill
/// </summary>
/// <param name="RatedUserId">User who owns the skill being rated</param>
/// <param name="Rating">Rating from 1-5 stars</param>
/// <param name="Comment">Optional comment for the rating</param>
/// <param name="Tags">Optional tags for the rating</param>
public record RateSkillRequest(
    [Required(ErrorMessage = "Rated user ID is required")]
    string RatedUserId,
    
    [Required(ErrorMessage = "Rating is required")]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    int Rating,
    
    [StringLength(1000, ErrorMessage = "Comment must not exceed 1000 characters")]
    string? Comment = null,
    
    [MaxLength(5, ErrorMessage = "Maximum 5 tags allowed")]
    List<string>? Tags = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
