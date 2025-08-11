using Contracts.Common;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for RejectMatchRequest operation
/// </summary>
public record RejectMatchRequestRequest(
    string? ResponseMessage = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
