namespace Contracts.Chat.Requests;

/// <summary>
/// Request to add or remove a reaction to a message
/// </summary>
public record AddReactionRequest
{
    public required string MessageId { get; init; }
    public required string Emoji { get; init; }
    public bool Remove { get; init; } = false;
}
