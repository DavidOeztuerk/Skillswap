using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for UpdateEmailTemplate operation
/// </summary>
public record UpdateEmailTemplateResponse(
    string TemplateId,
    string Name,
    DateTime UpdatedAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
