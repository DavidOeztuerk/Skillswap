using Contracts.Common;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for AcceptMatchRequest operation
/// </summary>
public record AcceptMatchProposalRequest(
    string? ResponseMessage = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
