namespace PaymentService.Domain.Entities;

/// <summary>
/// Payment lifecycle status
/// </summary>
public enum PaymentStatus
{
    /// <summary>Checkout session created, awaiting payment</summary>
    Pending,

    /// <summary>Payment is being processed by Stripe</summary>
    Processing,

    /// <summary>Payment completed successfully</summary>
    Succeeded,

    /// <summary>Payment failed</summary>
    Failed,

    /// <summary>Payment was refunded</summary>
    Refunded,

    /// <summary>User cancelled the checkout</summary>
    Cancelled
}
