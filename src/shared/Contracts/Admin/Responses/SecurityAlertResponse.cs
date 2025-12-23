namespace Contracts.Admin.Responses;

public record SecurityAlertResponse
{
    public string Id { get; init; } = string.Empty;
    public string Level { get; init; } = string.Empty; // Critical, High, Medium, Low, Info
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string? UserId { get; init; }
    public string? IPAddress { get; init; }
    public string? UserAgent { get; init; }
    public string? Endpoint { get; init; }
    public Dictionary<string, object> Metadata { get; init; } = new();
    public bool IsRead { get; init; }
    public DateTime? ReadAt { get; init; }
    public string? ReadByAdminId { get; init; }
    public bool IsDismissed { get; init; }
    public DateTime? DismissedAt { get; init; }
    public string? DismissedByAdminId { get; init; }
    public string? DismissalReason { get; init; }
    public DateTime OccurredAt { get; init; }
    public int OccurrenceCount { get; init; }
    public DateTime? LastOccurrenceAt { get; init; }
    public DateTime CreatedAt { get; init; }
}
