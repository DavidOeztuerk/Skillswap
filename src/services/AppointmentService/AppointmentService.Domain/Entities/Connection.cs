using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace AppointmentService.Domain.Entities;

/// <summary>
/// Represents a persistent partnership/connection between two users
/// Created when a Match is accepted - serves as the overarching container for all sessions
/// Replaces the concept of Match storing duplicate data
/// </summary>
public class Connection : AuditableEntity
{
    /// <summary>
    /// ID of the original MatchRequest that led to this connection
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string MatchRequestId { get; set; } = string.Empty;

    /// <summary>
    /// ThreadId from MatchRequest (SHA256-GUID format) for Chat integration.
    /// Links this connection to the ChatThread.
    /// </summary>
    [MaxLength(450)]
    public string? ThreadId { get; set; }

    /// <summary>
    /// User who initiated the match request
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string RequesterId { get; set; } = string.Empty;

    /// <summary>
    /// User who accepted the match request
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string TargetUserId { get; set; } = string.Empty;

    /// <summary>
    /// Type of connection: SkillExchange, Payment, or Free
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ConnectionType { get; set; } = Entities.ConnectionType.SkillExchange;

    /// <summary>
    /// Primary skill being taught/exchanged
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// For skill exchange: The skill being exchanged in return
    /// </summary>
    [MaxLength(450)]
    public string? ExchangeSkillId { get; set; }

    /// <summary>
    /// For payment-based connections: Hourly rate
    /// </summary>
    public decimal? PaymentRatePerHour { get; set; }

    /// <summary>
    /// Currency for payment (EUR, USD, etc.)
    /// </summary>
    [MaxLength(10)]
    public string? Currency { get; set; }

    /// <summary>
    /// Session balance for skill exchange
    /// Positive: TargetUser owes sessions to Requester
    /// Negative: Requester owes sessions to TargetUser
    /// Zero: Balanced
    /// Example: +2 means TargetUser owes 2 hours
    /// </summary>
    public int SessionBalanceMinutes { get; set; } = 0;

    /// <summary>
    /// Current status of the connection
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = ConnectionStatus.Active;

    /// <summary>
    /// Reason for pausing or dissolving
    /// </summary>
    [MaxLength(1000)]
    public string? StatusReason { get; set; }

    /// <summary>
    /// Total number of sessions planned across all series
    /// </summary>
    public int TotalSessionsPlanned { get; set; } = 0;

    /// <summary>
    /// Total number of sessions completed
    /// </summary>
    public int TotalSessionsCompleted { get; set; } = 0;

    /// <summary>
    /// When the connection was established
    /// </summary>
    public DateTime EstablishedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the connection was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// When the connection was dissolved
    /// </summary>
    public DateTime? DissolvedAt { get; set; }

    /// <summary>
    /// All session series under this connection
    /// </summary>
    public virtual ICollection<SessionSeries> SessionSeries { get; set; } = new List<SessionSeries>();

    // Helper properties
    public bool IsActive => Status == ConnectionStatus.Active;
    public bool IsPaused => Status == ConnectionStatus.Paused;
    public bool IsCompleted => Status == ConnectionStatus.Completed;
    public bool IsDissolved => Status == ConnectionStatus.Dissolved;
    public bool IsSkillExchange => ConnectionType == Entities.ConnectionType.SkillExchange;
    public bool IsPaymentBased => ConnectionType == Entities.ConnectionType.Payment;
    public bool IsBalanced => SessionBalanceMinutes == 0;
    public bool RequesterOwesTime => SessionBalanceMinutes < 0;
    public bool TargetUserOwesTime => SessionBalanceMinutes > 0;

    /// <summary>
    /// Creates a new active connection
    /// </summary>
    public static Connection Create(
        string matchRequestId,
        string requesterId,
        string targetUserId,
        string connectionType,
        string skillId,
        string? exchangeSkillId = null,
        decimal? paymentRatePerHour = null,
        string? currency = null,
        string? threadId = null)
    {
        return new Connection
        {
            Id = Guid.NewGuid().ToString(),
            MatchRequestId = matchRequestId,
            ThreadId = threadId,
            RequesterId = requesterId,
            TargetUserId = targetUserId,
            ConnectionType = connectionType,
            SkillId = skillId,
            ExchangeSkillId = exchangeSkillId,
            PaymentRatePerHour = paymentRatePerHour,
            Currency = currency,
            Status = ConnectionStatus.Active,
            EstablishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Pause the connection
    /// </summary>
    public void Pause(string reason)
    {
        Status = ConnectionStatus.Paused;
        StatusReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Resume the connection
    /// </summary>
    public void Resume()
    {
        Status = ConnectionStatus.Active;
        StatusReason = null;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark connection as completed
    /// </summary>
    public void Complete()
    {
        Status = ConnectionStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Dissolve the connection before completion
    /// </summary>
    public void Dissolve(string reason)
    {
        Status = ConnectionStatus.Dissolved;
        StatusReason = reason;
        DissolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update session balance after a session completes
    /// For skill exchange: Adjust balance based on who taught
    /// </summary>
    public void UpdateSessionBalance(int durationMinutes, string teacherUserId)
    {
        if (!IsSkillExchange)
            return;

        // If requester taught, target user owes time (positive balance)
        if (teacherUserId == RequesterId)
        {
            SessionBalanceMinutes += durationMinutes;
        }
        // If target user taught, requester owes time (negative balance)
        else if (teacherUserId == TargetUserId)
        {
            SessionBalanceMinutes -= durationMinutes;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Increment completed sessions counter
    /// </summary>
    public void IncrementCompletedSessions()
    {
        TotalSessionsCompleted++;
        UpdatedAt = DateTime.UtcNow;

        // Auto-complete if all planned sessions are done
        if (TotalSessionsCompleted >= TotalSessionsPlanned && TotalSessionsPlanned > 0)
        {
            Complete();
        }
    }
}

/// <summary>
/// Type of connection between users
/// </summary>
public static class ConnectionType
{
    /// <summary>
    /// Skill exchange - users teach each other
    /// </summary>
    public const string SkillExchange = "SkillExchange";

    /// <summary>
    /// Payment-based - one user pays the other
    /// </summary>
    public const string Payment = "Payment";

    /// <summary>
    /// Free - no payment or exchange expected
    /// </summary>
    public const string Free = "Free";
}
