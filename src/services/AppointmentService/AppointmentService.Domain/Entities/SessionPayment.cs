using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;

namespace AppointmentService.Domain.Entities;

/// <summary>
/// Represents a payment transaction for a session
/// Tracks payment processing, status, and provider details
/// </summary>
public class SessionPayment : AuditableEntity
{
    /// <summary>
    /// The session appointment this payment is for
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SessionAppointmentId { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to SessionAppointment
    /// </summary>
    [ForeignKey(nameof(SessionAppointmentId))]
    public virtual SessionAppointment SessionAppointment { get; set; } = null!;

    /// <summary>
    /// User who is paying (usually participant)
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string PayerId { get; set; } = string.Empty;

    /// <summary>
    /// User who receives payment (usually organizer)
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string PayeeId { get; set; } = string.Empty;

    /// <summary>
    /// Payment amount
    /// </summary>
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    /// <summary>
    /// Currency code (USD, EUR, GBP, etc.)
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string Currency { get; set; } = "EUR";

    /// <summary>
    /// Current payment status
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = SessionPaymentStatus.Pending;

    /// <summary>
    /// Transaction ID from payment provider (Stripe, PayPal, etc.)
    /// </summary>
    [MaxLength(500)]
    public string? TransactionId { get; set; }

    /// <summary>
    /// Payment provider (Stripe, PayPal, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? Provider { get; set; }

    /// <summary>
    /// Payment method used (card, paypal, bank_transfer, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? PaymentMethod { get; set; }

    /// <summary>
    /// Last 4 digits of card (for security/audit)
    /// </summary>
    [MaxLength(4)]
    public string? CardLast4 { get; set; }

    /// <summary>
    /// When payment processing started
    /// </summary>
    public DateTime? ProcessingStartedAt { get; set; }

    /// <summary>
    /// When payment was completed
    /// </summary>
    public DateTime? ProcessedAt { get; set; }

    /// <summary>
    /// Error message if payment failed
    /// </summary>
    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Retry count (for failed payments)
    /// </summary>
    public int RetryCount { get; set; } = 0;

    /// <summary>
    /// Maximum retry count before giving up
    /// </summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// When last retry attempt was made
    /// </summary>
    public DateTime? LastRetryAt { get; set; }

    /// <summary>
    /// For refunds: original payment this refund is for
    /// </summary>
    [MaxLength(450)]
    public string? RefundForPaymentId { get; set; }

    /// <summary>
    /// Reason for refund
    /// </summary>
    [MaxLength(500)]
    public string? RefundReason { get; set; }

    /// <summary>
    /// When refund was issued
    /// </summary>
    public DateTime? RefundedAt { get; set; }

    /// <summary>
    /// Platform fee deducted from this payment
    /// </summary>
    public decimal PlatformFee { get; set; } = 0;

    /// <summary>
    /// Net amount received by payee
    /// </summary>
    public decimal NetAmount { get; set; }

    /// <summary>
    /// Additional metadata (JSON string)
    /// </summary>
    [MaxLength(2000)]
    public string? Metadata { get; set; }

    // Helper properties
    public bool IsPending => Status == SessionPaymentStatus.Pending;
    public bool IsProcessing => Status == SessionPaymentStatus.Processing;
    public bool IsCompleted => Status == SessionPaymentStatus.Completed;
    public bool IsFailed => Status == SessionPaymentStatus.Failed;
    public bool IsRefunded => Status == SessionPaymentStatus.Refunded;
    public bool IsRetryable => IsFailed && RetryCount < MaxRetries;

    /// <summary>
    /// Creates a new session payment
    /// </summary>
    public static SessionPayment Create(
        string sessionAppointmentId,
        string payerId,
        string payeeId,
        decimal amount,
        string currency = "EUR",
        decimal? platformFeePercent = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be greater than 0");

        if (payerId == payeeId)
            throw new ArgumentException("Payer and payee must be different");

        var platformFee = platformFeePercent.HasValue ? amount * (platformFeePercent.Value / 100m) : 0;
        var netAmount = amount - platformFee;

        return new SessionPayment
        {
            Id = Guid.NewGuid().ToString(),
            SessionAppointmentId = sessionAppointmentId,
            PayerId = payerId,
            PayeeId = payeeId,
            Amount = amount,
            Currency = currency,
            PlatformFee = platformFee,
            NetAmount = netAmount,
            Status = SessionPaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Mark payment as processing
    /// </summary>
    public void StartProcessing()
    {
        if (!IsPending)
            throw new InvalidOperationException("Only pending payments can be processed");

        Status = SessionPaymentStatus.Processing;
        ProcessingStartedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark payment as completed
    /// </summary>
    public void Complete(string? transactionId = null, string? provider = null)
    {
        Status = SessionPaymentStatus.Completed;
        TransactionId = transactionId ?? TransactionId;
        Provider = provider ?? Provider;
        ProcessedAt = DateTime.UtcNow;
        ErrorMessage = null;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark payment as failed
    /// </summary>
    public void Fail(string errorMessage)
    {
        Status = SessionPaymentStatus.Failed;
        ErrorMessage = errorMessage;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Retry failed payment
    /// </summary>
    public void Retry()
    {
        if (!IsRetryable)
            throw new InvalidOperationException("Payment cannot be retried");

        RetryCount++;
        LastRetryAt = DateTime.UtcNow;
        Status = SessionPaymentStatus.Processing;
        ErrorMessage = null;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Process refund
    /// </summary>
    public void Refund(string reason)
    {
        if (!IsCompleted)
            throw new InvalidOperationException("Only completed payments can be refunded");

        Status = SessionPaymentStatus.Refunded;
        RefundReason = reason;
        RefundedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Payment status enumeration
/// </summary>
public static class SessionPaymentStatus
{
    /// <summary>
    /// Payment pending, not yet processed
    /// </summary>
    public const string Pending = "Pending";

    /// <summary>
    /// Payment is being processed
    /// </summary>
    public const string Processing = "Processing";

    /// <summary>
    /// Payment completed successfully
    /// </summary>
    public const string Completed = "Completed";

    /// <summary>
    /// Payment failed
    /// </summary>
    public const string Failed = "Failed";

    /// <summary>
    /// Payment was refunded
    /// </summary>
    public const string Refunded = "Refunded";
}
