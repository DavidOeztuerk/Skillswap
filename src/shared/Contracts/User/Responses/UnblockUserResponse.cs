namespace Contracts.User.Responses;

/// <summary>
/// API response for UnblockUser operation
/// </summary>
public record UnblockUserResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
