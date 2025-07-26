using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for VerifyTwoFactorCode operation
/// </summary>
public record VerifyTwoFactorCodeRequest(
    string Code)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
