using System.ComponentModel.DataAnnotations;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for completing a match
/// </summary>
public record CompleteMatchRequest(
    [Required(ErrorMessage = "Match ID is required")]
    string MatchId,

    [Required(ErrorMessage = "Rating is required")]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    int Rating,

    [Required(ErrorMessage = "Session duration is required")]
    [Range(1, 480, ErrorMessage = "Duration must be between 1 and 480 minutes")]
    int SessionDurationMinutes,

    [StringLength(1000, ErrorMessage = "Feedback must not exceed 1000 characters")]
    string? Feedback = null,

    bool WouldMatchAgain = true)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
