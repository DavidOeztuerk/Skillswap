using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for GenerateTwoFactorSecret operation
/// </summary>
public record GenerateTwoFactorSecretRequest()
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
