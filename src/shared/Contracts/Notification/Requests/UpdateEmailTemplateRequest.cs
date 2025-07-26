using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for updating an email template
/// </summary>
/// <param name="TemplateId">ID of the template to update</param>
/// <param name="Name">Template name</param>
/// <param name="Subject">Email subject template</param>
/// <param name="HtmlContent">HTML content of the email</param>
/// <param name="TextContent">Plain text content of the email</param>
/// <param name="Variables">Template variables definition</param>
/// <param name="IsActive">Whether the template is active</param>
public record UpdateEmailTemplateRequest(
    [Required(ErrorMessage = "Template ID is required")]
    string TemplateId,

    [Required(ErrorMessage = "Template name is required")]
    [StringLength(100, ErrorMessage = "Name must not exceed 100 characters")]
    string Name,

    [Required(ErrorMessage = "Subject is required")]
    [StringLength(200, ErrorMessage = "Subject must not exceed 200 characters")]
    string Subject,

    [Required(ErrorMessage = "HTML content is required")]
    string HtmlContent,

    string? TextContent = null,

    [StringLength(1000, ErrorMessage = "Description must not exceed 1000 characters")]
    string? Description = null,

    Dictionary<string, string>? VariablesSchema = null,

    bool IsActive = true) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
