using Contracts.Common;

namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserActivity operation
/// </summary>
public record GetUserActivityResponse(
    PagedResponse<UserActivityItem> Activities)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record UserActivityItem(
    DateTime Timestamp,
    string ActivityType,
    string Description,
    string? IpAddress);