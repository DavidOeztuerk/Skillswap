namespace AppointmentService.Domain.Services;

/// <summary>
/// Stripe Payment Service
///
/// Handles payment processing through Stripe API
/// Features:
/// - Process payments for completed sessions
/// - Handle payment retries and failures
/// - Calculate platform fees
/// - Track transaction details
/// - Support for multiple payment methods
///
/// TODO: Integrate with actual Stripe API
/// - Add Stripe NuGet package: Stripe.net
/// - Configure Stripe API keys from configuration
/// - Implement real payment processing with Stripe SDK
/// </summary>
public interface IStripePaymentService
{
    /// <summary>
    /// Process a payment for a completed session
    /// </summary>
    Task<PaymentResult> ProcessSessionPaymentAsync(
        string sessionPaymentId,
        string payerId,
        string payeeId,
        decimal amount,
        string currency,
        string? paymentMethodToken = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retry a failed payment
    /// </summary>
    Task<PaymentResult> RetryPaymentAsync(
        string sessionPaymentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Refund a completed payment
    /// </summary>
    Task<RefundResult> RefundPaymentAsync(
        string sessionPaymentId,
        string? refundReason = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get payment status
    /// </summary>
    Task<PaymentStatusResult> GetPaymentStatusAsync(
        string sessionPaymentId,
        CancellationToken cancellationToken = default);
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? Details { get; set; }
}

public class RefundResult
{
    public bool Success { get; set; }
    public string RefundId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal RefundedAmount { get; set; }
    public string? ErrorMessage { get; set; }
}

public class PaymentStatusResult
{
    public string SessionPaymentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int RetryCount { get; set; }
}
