using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for sending a test email
/// </summary>
/// <param name="TemplateId">ID of the template to send</param>
/// <param name="RecipientEmail">Email address to send the test to</param>
/// <param name="Variables">Optional variables to use for rendering</param>
public record SendTestEmailRequest(
    [Required(ErrorMessage = "Template ID is required")]
    string TemplateId,

    [Required(ErrorMessage = "Recipient email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    string RecipientEmail,

    Dictionary<string, string>? Variables = null) : IVersionedContract
{
    public string ApiVersion => "v1";
}
