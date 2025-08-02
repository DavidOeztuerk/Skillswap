using Contracts.Common;

namespace Contracts.User.Responses;

/// <summary>
/// API response for BlockUser operation
/// </summary>
public record BlockUserResponse(
    string? UserId,
    string BlockedUserId,
    DateTime BlockedAt,
    string Message)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
