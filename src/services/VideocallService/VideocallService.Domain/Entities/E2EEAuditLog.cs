using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace VideocallService.Domain.Entities;

/// <summary>
/// E2EE Audit Log Entity
///
/// SECURITY: Only stores METADATA, never actual key content!
/// Purpose:
/// 1. Debugging E2EE issues
/// 2. Security forensics (detect MITM attempts)
/// 3. Rate limiting analysis
/// 4. Compliance logging
/// </summary>
public class E2EEAuditLog : AuditableEntity
{
    /// <summary>
    /// Session ID for correlation
    /// </summary>
    [MaxLength(450)]
    public string? SessionId { get; set; }

    /// <summary>
    /// Room ID for correlation
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string RoomId { get; set; } = string.Empty;

    /// <summary>
    /// User who initiated the E2EE operation
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string FromUserId { get; set; } = string.Empty;

    /// <summary>
    /// Target user for the E2EE operation
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string ToUserId { get; set; } = string.Empty;

    /// <summary>
    /// Type of E2EE operation
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string MessageType { get; set; } = string.Empty;

    /// <summary>
    /// Key fingerprint (first 16 chars of SHA-256 hash)
    /// NEVER the actual key content!
    /// </summary>
    [MaxLength(64)]
    public string? KeyFingerprint { get; set; }

    /// <summary>
    /// Key generation number
    /// </summary>
    public int? KeyGeneration { get; set; }

    /// <summary>
    /// Whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Error code if failed
    /// </summary>
    [MaxLength(50)]
    public string? ErrorCode { get; set; }

    /// <summary>
    /// Client IP address (for security analysis)
    /// </summary>
    [MaxLength(45)] // IPv6 max length
    public string? ClientIpAddress { get; set; }

    /// <summary>
    /// User agent for browser identification
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Payload size in bytes (for rate limiting analysis)
    /// </summary>
    public int PayloadSize { get; set; }

    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public int? ProcessingTimeMs { get; set; }

    /// <summary>
    /// Client timestamp from the message (for replay detection)
    /// </summary>
    public DateTime? ClientTimestamp { get; set; }

    /// <summary>
    /// Server timestamp when the message was processed
    /// </summary>
    public DateTime ServerTimestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether this was a rate-limited request
    /// </summary>
    public bool WasRateLimited { get; set; }

    /// <summary>
    /// Factory method for creating a log entry
    /// </summary>
    public static E2EEAuditLog Create(
        string roomId,
        string fromUserId,
        string toUserId,
        string messageType,
        bool success,
        int payloadSize,
        string? keyFingerprint = null,
        int? keyGeneration = null,
        string? errorCode = null,
        string? clientIpAddress = null,
        string? userAgent = null,
        DateTime? clientTimestamp = null)
    {
        return new E2EEAuditLog
        {
            Id = Guid.NewGuid().ToString(),
            RoomId = roomId,
            FromUserId = fromUserId,
            ToUserId = toUserId,
            MessageType = messageType,
            Success = success,
            PayloadSize = payloadSize,
            KeyFingerprint = keyFingerprint,
            KeyGeneration = keyGeneration,
            ErrorCode = errorCode,
            ClientIpAddress = clientIpAddress,
            UserAgent = userAgent,
            ClientTimestamp = clientTimestamp,
            ServerTimestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = fromUserId
        };
    }
}
