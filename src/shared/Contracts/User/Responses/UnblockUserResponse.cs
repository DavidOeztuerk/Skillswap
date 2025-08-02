using Contracts.Common;

namespace Contracts.User.Responses;

/// <summary>
/// API response for UnblockUser operation
/// </summary>
public record UnblockUserResponse(
    string? UserId,
    string UnblockedUserId,
    DateTime UnblockedAt,
    string Message)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
