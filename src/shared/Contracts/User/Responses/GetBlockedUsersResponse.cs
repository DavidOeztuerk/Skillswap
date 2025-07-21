namespace Contracts.User.Responses;

/// <summary>
/// API response for GetBlockedUsers operation
/// </summary>
public record GetBlockedUsersResponse(
    List<BlockedUserResponse> BlockedUsers,
    int TotalCount,
    int PageNumber,
    int PageSize)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record BlockedUserResponse(
    string UserId,
    string FirstName,
    string LastName,
    string? AvatarUrl,
    DateTime BlockedAt,
    string? Reason);
