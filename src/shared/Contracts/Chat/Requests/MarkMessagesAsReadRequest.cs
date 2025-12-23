namespace Contracts.Chat.Requests;

/// <summary>
/// Request to mark messages as read
/// </summary>
public record MarkMessagesAsReadRequest
{
    public required string ThreadId { get; init; }
    public DateTime? BeforeTimestamp { get; init; }
    public string? MessageId { get; init; }
}
