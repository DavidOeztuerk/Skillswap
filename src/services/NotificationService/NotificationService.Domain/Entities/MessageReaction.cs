using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Message reaction entity (replaces ChatMessage.ReactionsJson)
/// </summary>
public class MessageReaction : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string MessageId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// The reaction emoji (e.g., "👍", "❤️", "😄")
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Emoji { get; set; } = string.Empty;

    /// <summary>
    /// When the reaction was added
    /// </summary>
    public DateTime ReactedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual ChatMessage Message { get; set; } = null!;

    // Factory method
    public static MessageReaction Create(string messageId, string userId, string emoji)
    {
        return new MessageReaction
        {
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji,
            ReactedAt = DateTime.UtcNow
        };
    }
}
