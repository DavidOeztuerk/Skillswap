using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for GetCallStatistics operation
/// </summary>
public record GetCallStatisticsRequest(
    DateTime? FromDate = null,
    DateTime? ToDate = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
