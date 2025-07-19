using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for GetUserStatistics operation
/// </summary>
public record GetUserStatisticsRequest(
    // TODO: Add request parameters with validation
    string PlaceholderParam)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
