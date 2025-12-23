namespace Contracts.Chat.Responses;

/// <summary>
/// Response model for a chat message
/// </summary>
public record ChatMessageResponse
{
    public required string Id { get; init; }
    public required string ThreadId { get; init; }
    public required string SenderId { get; init; }
    public required string SenderName { get; init; }
    public string? SenderAvatarUrl { get; init; }
    public required string Content { get; init; }
    public string? RenderedHtml { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? EditedAt { get; init; }
    public bool IsEdited { get; init; }
    public required string MessageType { get; init; }
    public required string Context { get; init; }
    public string? ContextReferenceId { get; init; }

    // E2EE
    public bool IsEncrypted { get; init; }
    public string? EncryptedContent { get; init; }
    public string? EncryptionKeyId { get; init; }
    public string? EncryptionIV { get; init; }

    // File
    public string? FileUrl { get; init; }
    public string? FileName { get; init; }
    public string? FileMimeType { get; init; }
    public long? FileSize { get; init; }
    public string? FileSizeDisplay { get; init; }
    public string? ThumbnailUrl { get; init; }
    public int? ImageWidth { get; init; }
    public int? ImageHeight { get; init; }

    // Code
    public string? CodeLanguage { get; init; }

    // GIF
    public string? GiphyId { get; init; }
    public string? GifUrl { get; init; }

    // Reply
    public string? ReplyToMessageId { get; init; }
    public string? ReplyToPreview { get; init; }
    public string? ReplyToSenderName { get; init; }

    // Read status
    public DateTime? ReadAt { get; init; }
    public bool IsRead { get; init; }
    public DateTime? DeliveredAt { get; init; }

    // Reactions
    public Dictionary<string, List<string>>? Reactions { get; init; }
    public int ReactionCount { get; init; }

    // Attachments
    public List<ChatAttachmentResponse>? Attachments { get; init; }

    // Computed for current user
    public bool IsMine { get; init; }
}

/// <summary>
/// Response model for a chat attachment
/// </summary>
public record ChatAttachmentResponse
{
    public required string Id { get; init; }
    public required string FileName { get; init; }
    public required string OriginalFileName { get; init; }
    public required string MimeType { get; init; }
    public long FileSize { get; init; }
    public string? FileSizeDisplay { get; init; }
    public required string StorageUrl { get; init; }
    public string? ThumbnailUrl { get; init; }
    public int? Width { get; init; }
    public int? Height { get; init; }
    public int? DurationSeconds { get; init; }
    public bool IsEncrypted { get; init; }
    public string? FileCategory { get; init; }
    public string? FileIcon { get; init; }
    public DateTime UploadedAt { get; init; }
}
