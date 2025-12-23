using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for ChatAttachment operations
/// </summary>
public class ChatAttachmentRepository : IChatAttachmentRepository
{
    private readonly NotificationDbContext _dbContext;

    public ChatAttachmentRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<ChatAttachment?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatAttachments
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<List<ChatAttachment>> GetByMessageIdAsync(
        string messageId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatAttachments
            .Where(a => a.MessageId == messageId)
            .OrderBy(a => a.UploadedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatAttachment>> GetByThreadIdAsync(
        string threadId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatAttachments
            .Where(a => a.ThreadId == threadId)
            .OrderByDescending(a => a.UploadedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ChatAttachment>> GetByTypeAsync(
        string threadId,
        string fileCategory,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ChatAttachments
            .Where(a => a.ThreadId == threadId);

        // Filter by MIME type prefix based on category
        query = fileCategory.ToLower() switch
        {
            "image" => query.Where(a => a.MimeType.StartsWith("image/")),
            "video" => query.Where(a => a.MimeType.StartsWith("video/")),
            "audio" => query.Where(a => a.MimeType.StartsWith("audio/")),
            "document" => query.Where(a =>
                a.MimeType.Contains("pdf") ||
                a.MimeType.Contains("word") ||
                a.MimeType.Contains("document")),
            "spreadsheet" => query.Where(a =>
                a.MimeType.Contains("sheet") ||
                a.MimeType.Contains("excel")),
            "archive" => query.Where(a =>
                a.MimeType.Contains("zip") ||
                a.MimeType.Contains("rar") ||
                a.MimeType.Contains("tar")),
            "code" => query.Where(a =>
                a.MimeType.StartsWith("text/") ||
                a.MimeType.Contains("json") ||
                a.MimeType.Contains("xml")),
            _ => query
        };

        return await query
            .OrderByDescending(a => a.UploadedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<long> GetTotalStorageByUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatAttachments
            .Where(a => a.UploaderId == userId)
            .SumAsync(a => a.FileSize, cancellationToken);
    }

    public async Task<long> GetTotalStorageByThreadAsync(string threadId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatAttachments
            .Where(a => a.ThreadId == threadId)
            .SumAsync(a => a.FileSize, cancellationToken);
    }

    public async Task<ChatAttachment?> GetByContentHashAsync(
        string contentHash,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatAttachments
            .FirstOrDefaultAsync(a => a.ContentHash == contentHash, cancellationToken);
    }

    public async Task<List<ChatAttachment>> GetExpiredAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ChatAttachments
            .Where(a => a.ExpiresAt != null && a.ExpiresAt < DateTime.UtcNow)
            .ToListAsync(cancellationToken);
    }

    public async Task<ChatAttachment> AddAsync(ChatAttachment attachment, CancellationToken cancellationToken = default)
    {
        attachment.FileSizeDisplay = ChatAttachment.FormatFileSize(attachment.FileSize);
        await _dbContext.ChatAttachments.AddAsync(attachment, cancellationToken);
        return attachment;
    }

    public Task UpdateAsync(ChatAttachment attachment, CancellationToken cancellationToken = default)
    {
        _dbContext.ChatAttachments.Update(attachment);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ChatAttachment attachment, CancellationToken cancellationToken = default)
    {
        _dbContext.ChatAttachments.Remove(attachment);
        return Task.CompletedTask;
    }

    public async Task IncrementDownloadCountAsync(string id, CancellationToken cancellationToken = default)
    {
        var attachment = await GetByIdAsync(id, cancellationToken);
        if (attachment == null) return;

        attachment.DownloadCount++;
        attachment.LastDownloadedAt = DateTime.UtcNow;
        _dbContext.ChatAttachments.Update(attachment);
    }

    public async Task UpdateScanResultAsync(
        string id,
        bool isClean,
        string? scanResult,
        CancellationToken cancellationToken = default)
    {
        var attachment = await GetByIdAsync(id, cancellationToken);
        if (attachment == null) return;

        attachment.IsScanned = true;
        attachment.ScannedAt = DateTime.UtcNow;
        attachment.IsClean = isClean;
        attachment.ScanResult = scanResult;
        _dbContext.ChatAttachments.Update(attachment);
    }
}
