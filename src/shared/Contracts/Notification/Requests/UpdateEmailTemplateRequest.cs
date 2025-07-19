using System.ComponentModel.DataAnnotations;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for UpdateEmailTemplate operation
/// </summary>
public record UpdateEmailTemplateRequest(
    // TODO: Add request parameters with validation
    string PlaceholderParam)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
