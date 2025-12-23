using VideocallService.Domain.Entities;

namespace VideocallService.Domain.Repositories;

/// <summary>
/// Repository for managing chat messages in video call sessions
/// </summary>
public interface IChatMessageRepository
{
    /// <summary>
    /// Get all chat messages for a session
    /// </summary>
    Task<List<ChatMessage>> GetMessagesBySessionIdAsync(
        string sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent chat messages (last N messages)
    /// </summary>
    Task<List<ChatMessage>> GetRecentMessagesAsync(
        string sessionId,
        int limit = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new chat message
    /// </summary>
    Task<ChatMessage> CreateAsync(
        ChatMessage message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Add a new chat message (alias for CreateAsync)
    /// </summary>
    Task<ChatMessage> AddAsync(
        ChatMessage message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft delete a message
    /// </summary>
    Task DeleteMessageAsync(
        string messageId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get message count for a session
    /// </summary>
    Task<int> GetMessageCountAsync(
        string sessionId,
        CancellationToken cancellationToken = default);
}
