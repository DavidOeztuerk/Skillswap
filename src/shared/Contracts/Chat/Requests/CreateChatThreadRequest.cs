namespace Contracts.Chat.Requests;

/// <summary>
/// Request to create a new chat thread (usually triggered by MatchAccepted event)
/// </summary>
public record CreateChatThreadRequest
{
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
}
