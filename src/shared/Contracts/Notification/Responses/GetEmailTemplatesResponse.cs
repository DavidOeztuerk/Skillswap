namespace Contracts.Notification.Responses;

/// <summary>
/// API response for GetEmailTemplates operation
/// </summary>
public record GetEmailTemplatesResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
