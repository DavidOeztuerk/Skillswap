namespace Contracts.Chat.Responses;

/// <summary>
/// Response model for a chat thread
/// </summary>
public record ChatThreadResponse
{
    public required string Id { get; init; }
    public required string ThreadId { get; init; }
    public required string Participant1Id { get; init; }
    public required string Participant2Id { get; init; }
    public string? Participant1Name { get; init; }
    public string? Participant2Name { get; init; }
    public string? Participant1AvatarUrl { get; init; }
    public string? Participant2AvatarUrl { get; init; }
    public string? SkillId { get; init; }
    public string? SkillName { get; init; }
    public string? MatchId { get; init; }
    public DateTime? LastMessageAt { get; init; }
    public string? LastMessagePreview { get; init; }
    public string? LastMessageSenderId { get; init; }
    public int UnreadCount { get; init; }
    public int TotalMessageCount { get; init; }
    public bool IsLocked { get; init; }
    public string? LockReason { get; init; }
    public bool OtherParticipantIsTyping { get; init; }
    public DateTime CreatedAt { get; init; }

    // Computed fields for the current user
    public string? OtherParticipantId { get; init; }
    public string? OtherParticipantName { get; init; }
    public string? OtherParticipantAvatarUrl { get; init; }
}
