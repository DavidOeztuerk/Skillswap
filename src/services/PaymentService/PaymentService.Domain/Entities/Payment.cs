using Domain.Abstractions;

namespace PaymentService.Domain.Entities;

/// <summary>
/// Payment entity tracking Stripe checkout sessions
/// </summary>
public class Payment : AuditableEntity
{
    public string UserId { get; private set; } = string.Empty;
    public string ProductId { get; private set; } = string.Empty;
    public string? ReferenceId { get; private set; }
    public string? ReferenceType { get; private set; }

    // Stripe
    public string StripeSessionId { get; private set; } = string.Empty;
    public string? StripePaymentIntentId { get; private set; }

    // Amount
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "EUR";

    // Status
    public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;
    public DateTime? CompletedAt { get; private set; }
    public string? FailureReason { get; private set; }

    // Navigation
    public virtual PaymentProduct? Product { get; private set; }

    // Private constructor for EF
    private Payment() { }

    /// <summary>
    /// Factory method to create a new payment
    /// </summary>
    public static Payment Create(
        string userId,
        string productId,
        string stripeSessionId,
        decimal amount,
        string currency,
        string? referenceId = null,
        string? referenceType = null)
    {
        return new Payment
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            ProductId = productId,
            StripeSessionId = stripeSessionId,
            Amount = amount,
            Currency = currency,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Mark payment as succeeded
    /// </summary>
    public void MarkAsSucceeded(string? paymentIntentId)
    {
        Status = PaymentStatus.Succeeded;
        StripePaymentIntentId = paymentIntentId;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark payment as failed
    /// </summary>
    public void MarkAsFailed(string reason)
    {
        Status = PaymentStatus.Failed;
        FailureReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark payment as cancelled
    /// </summary>
    public void MarkAsCancelled()
    {
        Status = PaymentStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark payment as processing
    /// </summary>
    public void MarkAsProcessing()
    {
        Status = PaymentStatus.Processing;
        UpdatedAt = DateTime.UtcNow;
    }
}
