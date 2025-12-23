namespace Contracts.Chat.Requests;

/// <summary>
/// Request metadata for file upload (actual file comes via multipart form)
/// </summary>
public record UploadChatFileRequest
{
    public required string ThreadId { get; init; }
    public string? MessageContent { get; init; }
    public string Context { get; init; } = "Direct";
    public string? ContextReferenceId { get; init; }

    // E2EE
    public bool IsEncrypted { get; init; }
    public string? EncryptionKeyId { get; init; }
    public string? EncryptionIV { get; init; }
}
