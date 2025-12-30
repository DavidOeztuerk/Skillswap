using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for ChatMessage operations
/// </summary>
public class ChatMessageRepository : IChatMessageRepository
{
    private readonly NotificationDbContext _dbContext;

    public ChatMessageRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<ChatMessage?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Include(m => m.Attachments)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<List<ChatMessage>> GetByThreadIdAsync(
        string threadId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId)
            .OrderByDescending(m => m.SentAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(m => m.Attachments)
            .OrderBy(m => m.SentAt) // Reverse for display
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> GetAfterMessageIdAsync(
        string threadId,
        string afterMessageId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var referenceMessage = await _dbContext.ChatMessages
            .Where(m => m.Id == afterMessageId)
            .Select(m => m.SentAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (referenceMessage == default)
            return [];

        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.SentAt > referenceMessage)
            .OrderBy(m => m.SentAt)
            .Take(limit)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> GetAfterTimestampAsync(
        string threadId,
        DateTime afterTimestamp,
        int limit,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.SentAt > afterTimestamp)
            .OrderBy(m => m.SentAt)
            .Take(limit)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountByThreadIdAsync(string threadId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId)
            .CountAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> GetUnreadMessagesAsync(
        string threadId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.SenderId != userId && m.ReadAt == null)
            .OrderBy(m => m.SentAt)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(
        string threadId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.SenderId != userId && m.ReadAt == null)
            .CountAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> SearchAsync(
        string threadId,
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var lowerSearchTerm = searchTerm.ToLower();

        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId &&
                       m.Content.ToLower().Contains(lowerSearchTerm))
            .OrderByDescending(m => m.SentAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> GetByTypeAsync(
        string threadId,
        string messageType,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.MessageType == messageType)
            .OrderByDescending(m => m.SentAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> GetByContextAsync(
        string threadId,
        string context,
        string? contextReferenceId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.Context == context);

        if (!string.IsNullOrEmpty(contextReferenceId))
        {
            query = query.Where(m => m.ContextReferenceId == contextReferenceId);
        }

        return await query
            .OrderByDescending(m => m.SentAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);
    }

    public async Task<ChatMessage> AddAsync(ChatMessage message, CancellationToken cancellationToken = default)
    {
        await _dbContext.ChatMessages.AddAsync(message, cancellationToken);
        return message;
    }

    public Task UpdateAsync(ChatMessage message, CancellationToken cancellationToken = default)
    {
        message.EditedAt = DateTime.UtcNow;
        message.IsEdited = true;
        _dbContext.ChatMessages.Update(message);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ChatMessage message, CancellationToken cancellationToken = default)
    {
        _dbContext.ChatMessages.Remove(message);
        return Task.CompletedTask;
    }

    public async Task MarkAsReadAsync(string messageId, CancellationToken cancellationToken = default)
    {
        var message = await GetByIdAsync(messageId, cancellationToken);
        if (message == null) return;

        message.MarkAsRead();
        _dbContext.ChatMessages.Update(message);
    }

    public async Task MarkAllAsReadAsync(
        string threadId,
        string userId,
        DateTime beforeTimestamp,
        CancellationToken cancellationToken = default)
    {
        var unreadMessages = await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId &&
                       m.SenderId != userId &&
                       m.ReadAt == null &&
                       m.SentAt <= beforeTimestamp)
            .ToListAsync(cancellationToken);

        foreach (var message in unreadMessages)
        {
            message.MarkAsRead();
            // CRITICAL: Mark entity as modified so EF Core will persist the change!
            _dbContext.ChatMessages.Update(message);
        }
    }

    public async Task MarkAsDeliveredAsync(string messageId, CancellationToken cancellationToken = default)
    {
        var message = await GetByIdAsync(messageId, cancellationToken);
        if (message == null) return;

        message.MarkAsDelivered();
        _dbContext.ChatMessages.Update(message);
    }

    public async Task AddReactionAsync(
        string messageId,
        string userId,
        string emoji,
        CancellationToken cancellationToken = default)
    {
        var message = await GetByIdAsync(messageId, cancellationToken);
        if (message == null) return;

        var reactions = string.IsNullOrEmpty(message.ReactionsJson)
            ? new Dictionary<string, List<string>>()
            : JsonSerializer.Deserialize<Dictionary<string, List<string>>>(message.ReactionsJson) ?? [];

        if (!reactions.TryGetValue(emoji, out var users))
        {
            users = [];
            reactions[emoji] = users;
        }

        if (!users.Contains(userId))
        {
            users.Add(userId);
            message.ReactionCount++;
        }

        message.ReactionsJson = JsonSerializer.Serialize(reactions);
        _dbContext.ChatMessages.Update(message);
    }

    public async Task RemoveReactionAsync(
        string messageId,
        string userId,
        string emoji,
        CancellationToken cancellationToken = default)
    {
        var message = await GetByIdAsync(messageId, cancellationToken);
        if (message == null || string.IsNullOrEmpty(message.ReactionsJson)) return;

        var reactions = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(message.ReactionsJson) ?? [];

        if (reactions.TryGetValue(emoji, out var users) && users.Remove(userId))
        {
            message.ReactionCount--;
            if (users.Count == 0)
            {
                reactions.Remove(emoji);
            }
            message.ReactionsJson = reactions.Count > 0 ? JsonSerializer.Serialize(reactions) : null;
            _dbContext.ChatMessages.Update(message);
        }
    }

    public async Task<ChatMessage?> GetLastMessageAsync(string threadId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId)
            .OrderByDescending(m => m.SentAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> GetAroundMessageAsync(
        string threadId,
        string messageId,
        int beforeCount,
        int afterCount,
        CancellationToken cancellationToken = default)
    {
        var targetMessage = await _dbContext.ChatMessages
            .Where(m => m.Id == messageId)
            .Select(m => new { m.SentAt })
            .FirstOrDefaultAsync(cancellationToken);

        if (targetMessage == null)
            return [];

        var beforeMessages = await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.SentAt < targetMessage.SentAt)
            .OrderByDescending(m => m.SentAt)
            .Take(beforeCount)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);

        var afterMessages = await _dbContext.ChatMessages
            .Where(m => m.ThreadId == threadId && m.SentAt > targetMessage.SentAt)
            .OrderBy(m => m.SentAt)
            .Take(afterCount)
            .Include(m => m.Attachments)
            .ToListAsync(cancellationToken);

        var currentMessage = await GetByIdAsync(messageId, cancellationToken);

        var result = new List<ChatMessage>();
        result.AddRange(beforeMessages.OrderBy(m => m.SentAt));
        if (currentMessage != null)
            result.Add(currentMessage);
        result.AddRange(afterMessages);

        return result;
    }
}
