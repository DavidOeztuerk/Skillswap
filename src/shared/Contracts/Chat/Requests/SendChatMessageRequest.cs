namespace Contracts.Chat.Requests;

/// <summary>
/// Request to send a new chat message
/// </summary>
public record SendChatMessageRequest
{
    public required string ThreadId { get; init; }
    public required string Content { get; init; }
    public string MessageType { get; init; } = "Text";
    public string Context { get; init; } = "Direct";
    public string? ContextReferenceId { get; init; }

    // Reply support
    public string? ReplyToMessageId { get; init; }

    // Code block
    public string? CodeLanguage { get; init; }

    // GIF
    public string? GiphyId { get; init; }
    public string? GifUrl { get; init; }

    // E2EE
    public bool IsEncrypted { get; init; }
    public string? EncryptedContent { get; init; }
    public string? EncryptionKeyId { get; init; }
    public string? EncryptionIV { get; init; }
}
