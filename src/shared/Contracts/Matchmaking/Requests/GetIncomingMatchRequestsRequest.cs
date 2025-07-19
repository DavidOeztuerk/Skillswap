using System.ComponentModel.DataAnnotations;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for GetIncomingMatchRequests operation
/// </summary>
public record GetIncomingMatchRequestsRequest(
    int PageNumber = 1,
    int PageSize = 20)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
