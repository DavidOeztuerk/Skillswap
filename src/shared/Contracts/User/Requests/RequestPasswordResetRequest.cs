using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.User.Requests;

/// <summary>
/// API request for RequestPasswordReset operation
/// </summary>
public record RequestPasswordResetRequest(
    [Required]
    [EmailAddress]
    string Email)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
