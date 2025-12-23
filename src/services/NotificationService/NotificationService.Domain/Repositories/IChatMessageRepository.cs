using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

/// <summary>
/// Repository interface for ChatMessage operations
/// </summary>
public interface IChatMessageRepository
{
    /// <summary>
    /// Gets a message by its ID
    /// </summary>
    Task<ChatMessage?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets messages for a thread with pagination
    /// </summary>
    Task<List<ChatMessage>> GetByThreadIdAsync(
        string threadId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets messages for a thread after a specific message (for real-time sync)
    /// </summary>
    Task<List<ChatMessage>> GetAfterMessageIdAsync(
        string threadId,
        string afterMessageId,
        int limit,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets messages for a thread after a specific timestamp
    /// </summary>
    Task<List<ChatMessage>> GetAfterTimestampAsync(
        string threadId,
        DateTime afterTimestamp,
        int limit,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total count of messages in a thread
    /// </summary>
    Task<int> GetCountByThreadIdAsync(string threadId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unread messages for a user in a thread
    /// </summary>
    Task<List<ChatMessage>> GetUnreadMessagesAsync(
        string threadId,
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the count of unread messages for a user in a thread
    /// </summary>
    Task<int> GetUnreadCountAsync(
        string threadId,
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches messages in a thread
    /// </summary>
    Task<List<ChatMessage>> SearchAsync(
        string threadId,
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets messages by type (e.g., File, Image, CodeBlock)
    /// </summary>
    Task<List<ChatMessage>> GetByTypeAsync(
        string threadId,
        string messageType,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets messages in a specific context (e.g., VideoCall session)
    /// </summary>
    Task<List<ChatMessage>> GetByContextAsync(
        string threadId,
        string context,
        string? contextReferenceId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new message
    /// </summary>
    Task<ChatMessage> AddAsync(ChatMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing message
    /// </summary>
    Task UpdateAsync(ChatMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a message
    /// </summary>
    Task DeleteAsync(ChatMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks a single message as read
    /// </summary>
    Task MarkAsReadAsync(string messageId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks all messages before a timestamp as read for a user
    /// </summary>
    Task MarkAllAsReadAsync(
        string threadId,
        string userId,
        DateTime beforeTimestamp,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks a message as delivered
    /// </summary>
    Task MarkAsDeliveredAsync(string messageId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a reaction to a message
    /// </summary>
    Task AddReactionAsync(
        string messageId,
        string userId,
        string emoji,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a reaction from a message
    /// </summary>
    Task RemoveReactionAsync(
        string messageId,
        string userId,
        string emoji,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the last message in a thread
    /// </summary>
    Task<ChatMessage?> GetLastMessageAsync(string threadId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets messages around a specific message (for context when jumping to a message)
    /// </summary>
    Task<List<ChatMessage>> GetAroundMessageAsync(
        string threadId,
        string messageId,
        int beforeCount,
        int afterCount,
        CancellationToken cancellationToken = default);
}
