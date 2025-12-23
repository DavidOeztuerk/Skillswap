namespace Contracts.Admin.Responses;

public record SecurityAlertActionResponse
{
    public string AlertId { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty; // "Dismissed" or "MarkedAsRead"
    public string AdminUserId { get; init; } = string.Empty;
    public DateTime ActionAt { get; init; }
    public string? Reason { get; init; }
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
}
