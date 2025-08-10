using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for GetEmailTemplates operation
/// </summary>
public record GetEmailTemplatesResponse(
    EmailTemplateSummaryResponse Templates)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Summary of an email template for lists
/// </summary>
public record EmailTemplateSummaryResponse(
    string TemplateId,
    string Name,
    string Language,
    string Subject,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt);