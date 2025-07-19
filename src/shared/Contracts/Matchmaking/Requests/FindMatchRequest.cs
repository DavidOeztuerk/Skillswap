namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for FindMatchRequest operation
/// </summary>
public record FindMatchRequest(
    string SkillId,
    string SkillName,
    bool IsOffering,
    List<string>? PreferredTags = null,
    string? PreferredLocation = null,
    bool RemoteOnly = false,
    int? MaxDistanceKm = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}