namespace PaymentService.Application.Services;

/// <summary>
/// Stripe service interface for creating checkout sessions and handling webhooks
/// </summary>
public interface IStripeService
{
    Task<StripeCheckoutResult> CreateCheckoutSessionAsync(
        string productName,
        decimal amount,
        string currency,
        string successUrl,
        string cancelUrl,
        Dictionary<string, string> metadata,
        CancellationToken cancellationToken = default);

    StripeWebhookResult ConstructWebhookEvent(string json, string signature);
}

/// <summary>
/// Result of creating a Stripe checkout session
/// </summary>
public record StripeCheckoutResult(
    string SessionId,
    string Url);

/// <summary>
/// Result of parsing a Stripe webhook event
/// </summary>
public record StripeWebhookResult(
    string EventType,
    string? SessionId,
    string? PaymentIntentId,
    Dictionary<string, string> Metadata);
