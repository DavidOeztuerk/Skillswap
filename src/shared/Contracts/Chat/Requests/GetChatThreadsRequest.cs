namespace Contracts.Chat.Requests;

/// <summary>
/// Request to get all chat threads for a user
/// </summary>
public record GetChatThreadsRequest
{
    public int? PageNumber { get; init; }
    public int? PageSize { get; init; }
    public string? SearchTerm { get; init; }
    public bool? UnreadOnly { get; init; }
}
