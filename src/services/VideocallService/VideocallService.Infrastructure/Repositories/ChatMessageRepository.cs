using Microsoft.EntityFrameworkCore;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using VideocallService.Infrastructure.Data;

namespace VideocallService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for chat messages
/// </summary>
public class ChatMessageRepository : IChatMessageRepository
{
    private readonly VideoCallDbContext _context;

    public ChatMessageRepository(VideoCallDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChatMessage>> GetMessagesBySessionIdAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ChatMessages
            .Where(m => m.SessionId == sessionId && !m.IsDeleted)
            .OrderBy(m => m.SentAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatMessage>> GetRecentMessagesAsync(
        string sessionId,
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        return await _context.ChatMessages
            .Where(m => m.SessionId == sessionId && !m.IsDeleted)
            .OrderByDescending(m => m.SentAt)
            .Take(limit)
            .OrderBy(m => m.SentAt) // Re-order chronologically
            .ToListAsync(cancellationToken);
    }

    public async Task<ChatMessage> CreateAsync(
        ChatMessage message,
        CancellationToken cancellationToken = default)
    {
        await _context.ChatMessages.AddAsync(message, cancellationToken);
        return message;
    }

    public async Task DeleteMessageAsync(
        string messageId,
        CancellationToken cancellationToken = default)
    {
        var message = await _context.ChatMessages
            .FirstOrDefaultAsync(m => m.Id == messageId, cancellationToken);

        if (message != null)
        {
            message.IsDeleted = true;
            message.UpdatedAt = DateTime.UtcNow;
        }
    }

    public async Task<int> GetMessageCountAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ChatMessages
            .CountAsync(m => m.SessionId == sessionId && !m.IsDeleted, cancellationToken);
    }
}
