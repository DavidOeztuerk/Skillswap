using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

/// <summary>
/// Repository interface for ChatThread operations
/// </summary>
public interface IChatThreadRepository
{
    /// <summary>
    /// Gets a thread by its unique ThreadId (SHA256 hash from Matchmaking)
    /// </summary>
    Task<ChatThread?> GetByThreadIdAsync(string threadId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a thread by its database ID
    /// </summary>
    Task<ChatThread?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all threads for a user, ordered by last message date
    /// </summary>
    Task<List<ChatThread>> GetByUserIdAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total count of threads for a user
    /// </summary>
    Task<int> GetCountByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total unread message count across all threads for a user
    /// </summary>
    Task<int> GetTotalUnreadCountAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a thread by match ID
    /// </summary>
    Task<ChatThread?> GetByMatchIdAsync(string matchId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a thread between two participants for a specific skill
    /// </summary>
    Task<ChatThread?> GetByParticipantsAndSkillAsync(
        string participant1Id,
        string participant2Id,
        string skillId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a thread exists by ThreadId
    /// </summary>
    Task<bool> ExistsByThreadIdAsync(string threadId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets threads with unread messages for a user
    /// </summary>
    Task<List<ChatThread>> GetWithUnreadMessagesAsync(
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches threads by participant name or skill name
    /// </summary>
    Task<List<ChatThread>> SearchAsync(
        string userId,
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets count of search results
    /// </summary>
    Task<int> GetSearchCountAsync(
        string userId,
        string searchTerm,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets threads with unread messages for a user (paginated)
    /// </summary>
    Task<List<ChatThread>> GetWithUnreadMessagesPagedAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets count of threads with unread messages
    /// </summary>
    Task<int> GetWithUnreadMessagesCountAsync(
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new thread
    /// </summary>
    Task AddAsync(ChatThread thread, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing thread
    /// </summary>
    Task UpdateAsync(ChatThread thread, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a thread
    /// </summary>
    Task DeleteAsync(ChatThread thread, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks all messages in a thread as read for a user
    /// </summary>
    Task MarkAsReadAsync(string threadId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Locks a thread
    /// </summary>
    Task LockThreadAsync(string threadId, string reason, CancellationToken cancellationToken = default);

    /// <summary>
    /// Unlocks a thread
    /// </summary>
    Task UnlockThreadAsync(string threadId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates typing indicator for a user
    /// </summary>
    Task UpdateTypingIndicatorAsync(
        string threadId,
        string userId,
        bool isTyping,
        CancellationToken cancellationToken = default);
}
