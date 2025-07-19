namespace Contracts.Common;

/// <summary>
/// Standard API error response format
/// </summary>
/// <param name="Title">Error title</param>
/// <param name="Status">HTTP status code</param>
/// <param name="Detail">Detailed error message</param>
/// <param name="Instance">Request instance identifier</param>
/// <param name="Errors">Validation errors (if applicable)</param>
/// <param name="TraceId">Trace identifier for debugging</param>
public record ApiErrorResponse(
    string Title,
    int Status,
    string? Detail = null,
    string? Instance = null,
    Dictionary<string, string[]>? Errors = null,
    string? TraceId = null)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}