using System.ComponentModel.DataAnnotations;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for creating a match request to another user
/// </summary>
public record CreateMatchRequest(
    [Required(ErrorMessage = "Target user ID is required")]
    string TargetUserId,

    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,

    [Required(ErrorMessage = "Description is required")]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 1000 characters")]
    string Description,

    [Required(ErrorMessage = "Message is required")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Message must be between 5 and 500 characters")]
    string Message,

    [Required(ErrorMessage = "Must specify if this is for learning or teaching")]
    bool IsLearningMode,

    [Range(15, 480, ErrorMessage = "Session duration must be between 15 and 480 minutes")]
    int? PreferredSessionDuration = 60)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
