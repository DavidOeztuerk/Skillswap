using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for GetUserCallHistory operation
/// </summary>
public record GetUserCallHistoryRequest(
    int PageNumber = 1,
    int PageSize = 20)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
