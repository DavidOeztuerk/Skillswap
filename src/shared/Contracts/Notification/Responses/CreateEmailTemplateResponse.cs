namespace Contracts.Notification.Responses;

/// <summary>
/// API response for CreateEmailTemplate operation
/// </summary>
public record CreateEmailTemplateResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
