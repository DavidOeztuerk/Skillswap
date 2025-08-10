using Contracts.Common;

namespace Contracts.User.Responses;

/// <summary>
/// API response for GetAllUsers operation
/// </summary>
public record GetAllUsersResponse(
    UserSummaryResponse Users)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
