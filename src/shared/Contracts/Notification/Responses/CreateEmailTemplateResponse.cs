using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for CreateEmailTemplate operation
/// </summary>
public record CreateEmailTemplateResponse(
    string TemplateId,
    string Name,
    string Language,
    DateTime CreatedAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
