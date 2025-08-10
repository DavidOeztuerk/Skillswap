using Contracts.Common;

namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserActivity operation
/// </summary>
public record GetUserActivityResponse(
    UserActivityItem Activities)
    : IVersionedContract
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