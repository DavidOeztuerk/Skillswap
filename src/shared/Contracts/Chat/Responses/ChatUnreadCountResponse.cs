namespace Contracts.Chat.Responses;

/// <summary>
/// Response model for unread message counts
/// </summary>
public record ChatUnreadCountResponse
{
    public int TotalUnreadCount { get; init; }
    public List<ThreadUnreadCount> ThreadUnreadCounts { get; init; } = [];
}

public record ThreadUnreadCount
{
    public required string ThreadId { get; init; }
    public int UnreadCount { get; init; }
    public string? OtherParticipantName { get; init; }
}
