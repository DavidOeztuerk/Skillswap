using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Represents a single message in a chat thread.
/// Supports rich text (Markdown), files, code blocks, and end-to-end encryption.
/// </summary>
public class ChatMessage : AuditableEntity
{
    /// <summary>
    /// The thread this message belongs to (FK to ChatThread.ThreadId)
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string ThreadId { get; set; } = string.Empty;

    /// <summary>
    /// The sender's user ID
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SenderId { get; set; } = string.Empty;

    /// <summary>
    /// The sender's display name (cached)
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string SenderName { get; set; } = string.Empty;

    /// <summary>
    /// The sender's avatar URL (cached)
    /// </summary>
    [MaxLength(500)]
    public string? SenderAvatarUrl { get; set; }

    /// <summary>
    /// The raw message content (Markdown supported)
    /// </summary>
    [Required]
    [MaxLength(10000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Pre-rendered HTML version of the content (for performance)
    /// </summary>
    public string? RenderedHtml { get; set; }

    /// <summary>
    /// When the message was sent
    /// </summary>
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the message was edited (null if never edited)
    /// </summary>
    public DateTime? EditedAt { get; set; }

    /// <summary>
    /// Whether the message has been edited
    /// </summary>
    public bool IsEdited { get; set; }

    /// <summary>
    /// Type of message: Text, File, Image, CodeBlock, GIF, System, Emoji
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string MessageType { get; set; } = ChatMessageType.Text;

    /// <summary>
    /// Context where the message was sent: Direct, MatchRequest, Match, Appointment, VideoCall
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Context { get; set; } = ChatMessageContext.Direct;

    /// <summary>
    /// Reference ID for the context (e.g., AppointmentId, VideoCallSessionId)
    /// </summary>
    [MaxLength(450)]
    public string? ContextReferenceId { get; set; }

    #region End-to-End Encryption

    /// <summary>
    /// Whether the message content is encrypted
    /// </summary>
    public bool IsEncrypted { get; set; }

    /// <summary>
    /// The encrypted content (when IsEncrypted = true)
    /// </summary>
    public string? EncryptedContent { get; set; }

    /// <summary>
    /// The key ID used for encryption
    /// </summary>
    [MaxLength(450)]
    public string? EncryptionKeyId { get; set; }

    /// <summary>
    /// Initialization vector for encryption
    /// </summary>
    [MaxLength(100)]
    public string? EncryptionIV { get; set; }

    #endregion

    #region File Attachment

    /// <summary>
    /// URL of the attached file
    /// </summary>
    [MaxLength(1000)]
    public string? FileUrl { get; set; }

    /// <summary>
    /// Original file name
    /// </summary>
    [MaxLength(255)]
    public string? FileName { get; set; }

    /// <summary>
    /// MIME type of the file
    /// </summary>
    [MaxLength(100)]
    public string? FileMimeType { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long? FileSize { get; set; }

    /// <summary>
    /// Thumbnail URL for images/videos
    /// </summary>
    [MaxLength(1000)]
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Image dimensions (width)
    /// </summary>
    public int? ImageWidth { get; set; }

    /// <summary>
    /// Image dimensions (height)
    /// </summary>
    public int? ImageHeight { get; set; }

    #endregion

    #region Code Block

    /// <summary>
    /// Programming language for code blocks
    /// </summary>
    [MaxLength(50)]
    public string? CodeLanguage { get; set; }

    #endregion

    #region GIF

    /// <summary>
    /// Giphy GIF ID (for GIF messages)
    /// </summary>
    [MaxLength(100)]
    public string? GiphyId { get; set; }

    /// <summary>
    /// GIF URL
    /// </summary>
    [MaxLength(1000)]
    public string? GifUrl { get; set; }

    #endregion

    #region Reply/Thread

    /// <summary>
    /// ID of the message this is replying to
    /// </summary>
    [MaxLength(450)]
    public string? ReplyToMessageId { get; set; }

    /// <summary>
    /// Preview of the replied message
    /// </summary>
    [MaxLength(200)]
    public string? ReplyToPreview { get; set; }

    /// <summary>
    /// Sender name of the replied message
    /// </summary>
    [MaxLength(200)]
    public string? ReplyToSenderName { get; set; }

    #endregion

    #region Read Receipt

    /// <summary>
    /// When the message was read by the recipient
    /// </summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>
    /// Whether the message has been read
    /// </summary>
    public bool IsRead => ReadAt.HasValue;

    /// <summary>
    /// When the message was delivered
    /// </summary>
    public DateTime? DeliveredAt { get; set; }

    #endregion

    #region Reactions

    /// <summary>
    /// JSON-serialized reactions (e.g., {"👍": ["user1", "user2"], "❤️": ["user3"]})
    /// </summary>
    [MaxLength(4000)]
    public string? ReactionsJson { get; set; }

    /// <summary>
    /// Total reaction count
    /// </summary>
    public int ReactionCount { get; set; }

    #endregion

    #region Metadata

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    [MaxLength(4000)]
    public string? MetadataJson { get; set; }

    #endregion

    /// <summary>
    /// Navigation property to the thread
    /// </summary>
    public virtual ChatThread? Thread { get; set; }

    /// <summary>
    /// Navigation property to attachments
    /// </summary>
    public virtual ICollection<ChatAttachment> Attachments { get; set; } = [];

    /// <summary>
    /// Creates a system message
    /// </summary>
    public static ChatMessage CreateSystemMessage(string threadId, string content, string? contextReferenceId = null)
    {
        return new ChatMessage
        {
            ThreadId = threadId,
            SenderId = "system",
            SenderName = "System",
            Content = content,
            MessageType = ChatMessageType.System,
            Context = ChatMessageContext.Direct,
            ContextReferenceId = contextReferenceId,
            SentAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Marks the message as read
    /// </summary>
    public void MarkAsRead()
    {
        if (!ReadAt.HasValue)
        {
            ReadAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Marks the message as delivered
    /// </summary>
    public void MarkAsDelivered()
    {
        if (!DeliveredAt.HasValue)
        {
            DeliveredAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Soft-deletes the message by marking it as deleted and clearing content
    /// </summary>
    public void MarkAsDeleted(string? deletedBy = null)
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedBy = deletedBy;
        Content = "[Message deleted]";
        EncryptedContent = null;
    }
}

/// <summary>
/// Message type constants
/// </summary>
public static class ChatMessageType
{
    public const string Text = "Text";
    public const string File = "File";
    public const string Image = "Image";
    public const string CodeBlock = "CodeBlock";
    public const string GIF = "GIF";
    public const string System = "System";
    public const string Emoji = "Emoji";
    public const string Link = "Link";
}

/// <summary>
/// Message context constants
/// </summary>
public static class ChatMessageContext
{
    public const string Direct = "Direct";
    public const string MatchRequest = "MatchRequest";
    public const string Match = "Match";
    public const string Appointment = "Appointment";
    public const string VideoCall = "VideoCall";
}
