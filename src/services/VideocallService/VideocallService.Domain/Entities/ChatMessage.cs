using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace VideocallService.Domain.Entities;

/// <summary>
/// Represents a chat message sent during a video call session.
/// Persisted to database for chat history retrieval on rejoin.
/// </summary>
public class ChatMessage : AuditableEntity
{
    /// <summary>
    /// Session this message belongs to
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// User who sent the message
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SenderId { get; set; } = string.Empty;

    /// <summary>
    /// Display name of sender (denormalized for performance)
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string SenderName { get; set; } = string.Empty;

    /// <summary>
    /// Message content
    /// </summary>
    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// When the message was sent (UTC)
    /// </summary>
    [Required]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Message type (Text, System, File, etc.)
    /// </summary>
    [MaxLength(50)]
    public string MessageType { get; set; } = ChatMessageType.Text;

    /// <summary>
    /// Optional metadata (for file attachments, reactions, etc.)
    /// Stored as JSON
    /// </summary>
    [MaxLength(1000)]
    public string? Metadata { get; set; }

    // Navigation properties
    public VideoCallSession? Session { get; set; }
}

/// <summary>
/// Chat message types
/// </summary>
public static class ChatMessageType
{
    public const string Text = "Text";
    public const string System = "System";
    public const string File = "File";
    public const string Emoji = "Emoji";
}
