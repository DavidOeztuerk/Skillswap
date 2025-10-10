using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for creating a match request - display-focused
/// </summary>
public record CreateMatchRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,

    [Required(ErrorMessage = "Target User ID is required")]
    string TargetUserId,

    [Required(ErrorMessage = "Message is required")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Message must be between 5 and 500 characters")]
    string Message,

    bool IsSkillExchange = false,
    string? ExchangeSkillId = null,
    bool IsMonetary = false,
    decimal? OfferedAmount = null,
    string Currency = "EUR",
    int SessionDurationMinutes = 60,
    int TotalSessions = 1,
    string[]? PreferredDays = null,
    string[]? PreferredTimes = null,

    [StringLength(2000, ErrorMessage = "Additional notes must not exceed 2000 characters")]
    string? AdditionalNotes = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
