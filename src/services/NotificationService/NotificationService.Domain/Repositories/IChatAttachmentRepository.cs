using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

/// <summary>
/// Repository interface for ChatAttachment operations
/// </summary>
public interface IChatAttachmentRepository
{
    /// <summary>
    /// Gets an attachment by its ID
    /// </summary>
    Task<ChatAttachment?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets attachments for a message
    /// </summary>
    Task<List<ChatAttachment>> GetByMessageIdAsync(
        string messageId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all attachments in a thread (for media gallery)
    /// </summary>
    Task<List<ChatAttachment>> GetByThreadIdAsync(
        string threadId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets attachments by type (images, documents, etc.)
    /// </summary>
    Task<List<ChatAttachment>> GetByTypeAsync(
        string threadId,
        string fileCategory,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total storage used by a user
    /// </summary>
    Task<long> GetTotalStorageByUserAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total storage used in a thread
    /// </summary>
    Task<long> GetTotalStorageByThreadAsync(string threadId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an attachment exists by content hash (for deduplication)
    /// </summary>
    Task<ChatAttachment?> GetByContentHashAsync(
        string contentHash,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets expired attachments for cleanup
    /// </summary>
    Task<List<ChatAttachment>> GetExpiredAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new attachment
    /// </summary>
    Task<ChatAttachment> AddAsync(ChatAttachment attachment, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing attachment
    /// </summary>
    Task UpdateAsync(ChatAttachment attachment, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes an attachment
    /// </summary>
    Task DeleteAsync(ChatAttachment attachment, CancellationToken cancellationToken = default);

    /// <summary>
    /// Increments download count
    /// </summary>
    Task IncrementDownloadCountAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates virus scan result
    /// </summary>
    Task UpdateScanResultAsync(
        string id,
        bool isClean,
        string? scanResult,
        CancellationToken cancellationToken = default);
}
