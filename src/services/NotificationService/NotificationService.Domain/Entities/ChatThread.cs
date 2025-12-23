using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Represents a chat thread between two participants.
/// ThreadId is inherited from the Matchmaking system (SHA256 hash of sorted user IDs + skill ID).
/// </summary>
public class ChatThread : AuditableEntity
{
    /// <summary>
    /// The ThreadId from the Matchmaking system (SHA256 hash).
    /// This is the unique identifier used across all contexts.
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string ThreadId { get; set; } = string.Empty;

    /// <summary>
    /// First participant's user ID
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string Participant1Id { get; set; } = string.Empty;

    /// <summary>
    /// Second participant's user ID
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string Participant2Id { get; set; } = string.Empty;

    /// <summary>
    /// First participant's display name (cached for performance)
    /// </summary>
    [MaxLength(200)]
    public string? Participant1Name { get; set; }

    /// <summary>
    /// Second participant's display name (cached for performance)
    /// </summary>
    [MaxLength(200)]
    public string? Participant2Name { get; set; }

    /// <summary>
    /// First participant's avatar URL (cached for performance)
    /// </summary>
    [MaxLength(500)]
    public string? Participant1AvatarUrl { get; set; }

    /// <summary>
    /// Second participant's avatar URL (cached for performance)
    /// </summary>
    [MaxLength(500)]
    public string? Participant2AvatarUrl { get; set; }

    /// <summary>
    /// The skill ID associated with this chat thread
    /// </summary>
    [MaxLength(450)]
    public string? SkillId { get; set; }

    /// <summary>
    /// The skill name (cached for display)
    /// </summary>
    [MaxLength(200)]
    public string? SkillName { get; set; }

    /// <summary>
    /// The match ID associated with this thread (if any)
    /// </summary>
    [MaxLength(450)]
    public string? MatchId { get; set; }

    /// <summary>
    /// Timestamp of the last message in this thread
    /// </summary>
    public DateTime? LastMessageAt { get; set; }

    /// <summary>
    /// Preview of the last message (truncated to 100 chars)
    /// </summary>
    [MaxLength(150)]
    public string? LastMessagePreview { get; set; }

    /// <summary>
    /// Sender ID of the last message
    /// </summary>
    [MaxLength(450)]
    public string? LastMessageSenderId { get; set; }

    /// <summary>
    /// Unread message count for participant 1
    /// </summary>
    public int Participant1UnreadCount { get; set; }

    /// <summary>
    /// Unread message count for participant 2
    /// </summary>
    public int Participant2UnreadCount { get; set; }

    /// <summary>
    /// Total message count in this thread
    /// </summary>
    public int TotalMessageCount { get; set; }

    /// <summary>
    /// Whether the chat is locked (no new messages allowed)
    /// </summary>
    public bool IsLocked { get; set; }

    /// <summary>
    /// When the chat was locked
    /// </summary>
    public DateTime? LockedAt { get; set; }

    /// <summary>
    /// Reason for locking the chat
    /// </summary>
    [MaxLength(100)]
    public string? LockReason { get; set; }

    /// <summary>
    /// Whether participant 1 is currently typing
    /// </summary>
    public bool Participant1IsTyping { get; set; }

    /// <summary>
    /// Whether participant 2 is currently typing
    /// </summary>
    public bool Participant2IsTyping { get; set; }

    /// <summary>
    /// Last typing indicator update for participant 1
    /// </summary>
    public DateTime? Participant1TypingAt { get; set; }

    /// <summary>
    /// Last typing indicator update for participant 2
    /// </summary>
    public DateTime? Participant2TypingAt { get; set; }

    /// <summary>
    /// Navigation property to messages in this thread
    /// </summary>
    public virtual ICollection<ChatMessage> Messages { get; set; } = [];

    /// <summary>
    /// Checks if a user is a participant in this thread
    /// </summary>
    public bool IsParticipant(string userId)
    {
        return Participant1Id == userId || Participant2Id == userId;
    }

    /// <summary>
    /// Gets the other participant's ID
    /// </summary>
    public string GetOtherParticipantId(string userId)
    {
        return Participant1Id == userId ? Participant2Id : Participant1Id;
    }

    /// <summary>
    /// Gets the other participant's name
    /// </summary>
    public string? GetOtherParticipantName(string userId)
    {
        return Participant1Id == userId ? Participant2Name : Participant1Name;
    }

    /// <summary>
    /// Gets the unread count for a specific user
    /// </summary>
    public int GetUnreadCount(string userId)
    {
        return Participant1Id == userId ? Participant1UnreadCount : Participant2UnreadCount;
    }

    /// <summary>
    /// Increments the unread count for the recipient
    /// </summary>
    public void IncrementUnreadCount(string senderId)
    {
        if (Participant1Id == senderId)
        {
            Participant2UnreadCount++;
        }
        else
        {
            Participant1UnreadCount++;
        }
    }

    /// <summary>
    /// Resets the unread count for a user when they read messages
    /// </summary>
    public void MarkAsRead(string userId)
    {
        if (Participant1Id == userId)
        {
            Participant1UnreadCount = 0;
        }
        else
        {
            Participant2UnreadCount = 0;
        }
    }

    /// <summary>
    /// Updates the last message info
    /// </summary>
    public void UpdateLastMessage(string senderId, string content, DateTime sentAt)
    {
        LastMessageSenderId = senderId;
        LastMessageAt = sentAt;
        LastMessagePreview = content.Length > 100 ? content[..97] + "..." : content;
        TotalMessageCount++;
    }

    /// <summary>
    /// Locks the chat thread
    /// </summary>
    public void Lock(string reason)
    {
        IsLocked = true;
        LockedAt = DateTime.UtcNow;
        LockReason = reason;
    }

    /// <summary>
    /// Unlocks the chat thread
    /// </summary>
    public void Unlock()
    {
        IsLocked = false;
        LockedAt = null;
        LockReason = null;
    }
}
