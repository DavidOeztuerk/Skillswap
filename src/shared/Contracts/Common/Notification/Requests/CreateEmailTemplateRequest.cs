using System.ComponentModel.DataAnnotations;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for CreateEmailTemplate operation
/// </summary>
public record CreateEmailTemplateRequest(
    // TODO: Add request parameters with validation
    string PlaceholderParam)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
