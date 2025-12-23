using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for previewing an email template
/// </summary>
/// <param name="TemplateId">ID of the template to preview</param>
/// <param name="Variables">Optional variables to use for rendering</param>
public record PreviewTemplateRequest(
    [Required(ErrorMessage = "Template ID is required")]
    string TemplateId,

    Dictionary<string, string>? Variables = null) : IVersionedContract
{
    public string ApiVersion => "v1";
}
