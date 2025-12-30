using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for ChatThread operations
/// </summary>
public class ChatThreadRepository : IChatThreadRepository
{
    private readonly NotificationDbContext _dbContext;

    public ChatThreadRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<ChatThread?> GetByThreadIdAsync(string threadId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .FirstOrDefaultAsync(t => t.ThreadId == threadId, cancellationToken);
    }

    public async Task<ChatThread?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<List<ChatThread>> GetByUserIdAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .Where(t => t.Participant1Id == userId || t.Participant2Id == userId)
            .OrderByDescending(t => t.LastMessageAt ?? t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .Where(t => t.Participant1Id == userId || t.Participant2Id == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> GetTotalUnreadCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .Where(t => t.Participant1Id == userId || t.Participant2Id == userId)
            .SumAsync(t => t.Participant1Id == userId
                ? t.Participant1UnreadCount
                : t.Participant2UnreadCount, cancellationToken);
    }

    public async Task<ChatThread?> GetByMatchIdAsync(string matchId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .FirstOrDefaultAsync(t => t.MatchId == matchId, cancellationToken);
    }

    public async Task<ChatThread?> GetByParticipantsAndSkillAsync(
        string participant1Id,
        string participant2Id,
        string skillId,
        CancellationToken cancellationToken = default)
    {
        // Check both orderings since we don't know which user was stored as Participant1
        return await _dbContext.ChatThreads
            .FirstOrDefaultAsync(t =>
                t.SkillId == skillId &&
                ((t.Participant1Id == participant1Id && t.Participant2Id == participant2Id) ||
                 (t.Participant1Id == participant2Id && t.Participant2Id == participant1Id)),
                cancellationToken);
    }

    public async Task<bool> ExistsByThreadIdAsync(string threadId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .AnyAsync(t => t.ThreadId == threadId, cancellationToken);
    }

    public async Task<List<ChatThread>> GetWithUnreadMessagesAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .Where(t =>
                (t.Participant1Id == userId && t.Participant1UnreadCount > 0) ||
                (t.Participant2Id == userId && t.Participant2UnreadCount > 0))
            .OrderByDescending(t => t.LastMessageAt ?? t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatThread>> SearchAsync(
        string userId,
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var lowerSearchTerm = searchTerm.ToLower();

        return await _dbContext.ChatThreads
            .Where(t =>
                (t.Participant1Id == userId || t.Participant2Id == userId) &&
                (
                    (t.Participant1Name != null && t.Participant1Name.ToLower().Contains(lowerSearchTerm)) ||
                    (t.Participant2Name != null && t.Participant2Name.ToLower().Contains(lowerSearchTerm)) ||
                    (t.SkillName != null && t.SkillName.ToLower().Contains(lowerSearchTerm))
                ))
            .OrderByDescending(t => t.LastMessageAt ?? t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetSearchCountAsync(
        string userId,
        string searchTerm,
        CancellationToken cancellationToken = default)
    {
        var lowerSearchTerm = searchTerm.ToLower();

        return await _dbContext.ChatThreads
            .Where(t =>
                (t.Participant1Id == userId || t.Participant2Id == userId) &&
                (
                    (t.Participant1Name != null && t.Participant1Name.ToLower().Contains(lowerSearchTerm)) ||
                    (t.Participant2Name != null && t.Participant2Name.ToLower().Contains(lowerSearchTerm)) ||
                    (t.SkillName != null && t.SkillName.ToLower().Contains(lowerSearchTerm))
                ))
            .CountAsync(cancellationToken);
    }

    public async Task<List<ChatThread>> GetWithUnreadMessagesPagedAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .Where(t =>
                (t.Participant1Id == userId && t.Participant1UnreadCount > 0) ||
                (t.Participant2Id == userId && t.Participant2UnreadCount > 0))
            .OrderByDescending(t => t.LastMessageAt ?? t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetWithUnreadMessagesCountAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatThreads
            .Where(t =>
                (t.Participant1Id == userId && t.Participant1UnreadCount > 0) ||
                (t.Participant2Id == userId && t.Participant2UnreadCount > 0))
            .CountAsync(cancellationToken);
    }

    public async Task AddAsync(ChatThread thread, CancellationToken cancellationToken = default)
    {
        await _dbContext.ChatThreads.AddAsync(thread, cancellationToken);
    }

    public Task UpdateAsync(ChatThread thread, CancellationToken cancellationToken = default)
    {
        _dbContext.ChatThreads.Update(thread);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ChatThread thread, CancellationToken cancellationToken = default)
    {
        // Soft delete is handled by SaveChangesAsync in DbContext
        _dbContext.ChatThreads.Remove(thread);
        return Task.CompletedTask;
    }

    public async Task MarkAsReadAsync(string threadId, string userId, CancellationToken cancellationToken = default)
    {
        var thread = await GetByThreadIdAsync(threadId, cancellationToken);
        if (thread == null) return;

        thread.MarkAsRead(userId);
        _dbContext.ChatThreads.Update(thread);

        // Also mark all messages as read
        var unreadMessages = await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.SenderId != userId && m.ReadAt == null)
            .ToListAsync(cancellationToken);

        foreach (var message in unreadMessages)
        {
            message.MarkAsRead();
        }
    }

    public async Task LockThreadAsync(string threadId, string reason, CancellationToken cancellationToken = default)
    {
        var thread = await GetByThreadIdAsync(threadId, cancellationToken);
        if (thread == null) return;

        thread.Lock(reason);
        _dbContext.ChatThreads.Update(thread);
    }

    public async Task UnlockThreadAsync(string threadId, CancellationToken cancellationToken = default)
    {
        var thread = await GetByThreadIdAsync(threadId, cancellationToken);
        if (thread == null) return;

        thread.Unlock();
        _dbContext.ChatThreads.Update(thread);
    }

    public async Task UpdateTypingIndicatorAsync(
        string threadId,
        string userId,
        bool isTyping,
        CancellationToken cancellationToken = default)
    {
        var thread = await GetByThreadIdAsync(threadId, cancellationToken);
        if (thread == null) return;

        if (thread.Participant1Id == userId)
        {
            thread.Participant1IsTyping = isTyping;
            thread.Participant1TypingAt = isTyping ? DateTime.UtcNow : null;
        }
        else if (thread.Participant2Id == userId)
        {
            thread.Participant2IsTyping = isTyping;
            thread.Participant2TypingAt = isTyping ? DateTime.UtcNow : null;
        }

        _dbContext.ChatThreads.Update(thread);
    }
}
