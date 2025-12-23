namespace Contracts.Chat.Requests;

/// <summary>
/// Request to get messages for a chat thread
/// </summary>
public record GetChatMessagesRequest
{
    public int? PageNumber { get; init; }
    public int? PageSize { get; init; }
    public string? AfterMessageId { get; init; }
    public DateTime? AfterTimestamp { get; init; }
    public string? SearchTerm { get; init; }
    public string? MessageType { get; init; }
    public string? Context { get; init; }
    public string? ContextReferenceId { get; init; }
}
