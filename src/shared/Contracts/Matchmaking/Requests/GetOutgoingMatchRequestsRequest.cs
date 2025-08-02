using Contracts.Common;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for GetOutgoingMatchRequests operation
/// </summary>
public record GetOutgoingMatchRequestsRequest(
    int PageNumber = 1,
    int PageSize = 20)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
