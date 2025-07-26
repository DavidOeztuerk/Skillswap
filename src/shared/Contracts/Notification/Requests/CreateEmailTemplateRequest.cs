using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for creating an email template
/// </summary>
/// <param name="Name">Template name</param>
/// <param name="Language">Template language</param>
/// <param name="Subject">Email subject template</param>
/// <param name="HtmlContent">HTML content of the email</param>
/// <param name="TextContent">Plain text content of the email</param>
/// <param name="Description">Template description</param>
/// <param name="VariablesSchema">Template variables schema</param>
public record CreateEmailTemplateRequest(
    [Required(ErrorMessage = "Template name is required")]
    [StringLength(100, ErrorMessage = "Name must not exceed 100 characters")]
    string Name,

    [Required(ErrorMessage = "Language is required")]
    [StringLength(10, MinimumLength = 2, ErrorMessage = "Language must be 2-10 characters")]
    string Language,

    [Required(ErrorMessage = "Subject is required")]
    [StringLength(500, ErrorMessage = "Subject must not exceed 500 characters")]
    string Subject,

    [Required(ErrorMessage = "HTML content is required")]
    string HtmlContent,

    [Required(ErrorMessage = "Text content is required")]
    string TextContent,

    [StringLength(1000, ErrorMessage = "Description must not exceed 1000 characters")]
    string? Description = null,

    Dictionary<string, string>? VariablesSchema = null) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
