namespace Contracts.Notification.Responses;

/// <summary>
/// API response for UpdateEmailTemplate operation
/// </summary>
public record UpdateEmailTemplateResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
