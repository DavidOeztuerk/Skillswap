using System.ComponentModel.DataAnnotations;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for creating a general match request for a skill
/// </summary>
public record CreateMatchRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,

    [Required(ErrorMessage = "Description is required")]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 1000 characters")]
    string Description,

    [Required(ErrorMessage = "Message is required")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Message must be between 5 and 500 characters")]
    string Message)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
