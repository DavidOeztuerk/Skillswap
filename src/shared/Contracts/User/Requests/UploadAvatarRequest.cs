using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for UploadAvatar operation
/// </summary>
public record UploadAvatarRequest(
    byte[] ImageData,
    string FileName,
    string ContentType)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
