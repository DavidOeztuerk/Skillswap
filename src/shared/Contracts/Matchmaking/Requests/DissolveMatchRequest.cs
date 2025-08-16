using System.ComponentModel.DataAnnotations;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for dissolving a match
/// </summary>
public record DissolveMatchRequest(
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    string Reason)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}