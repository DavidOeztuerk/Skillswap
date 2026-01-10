namespace PaymentService.Infrastructure.Services;

public class StripeSettings
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;

    /// <summary>
    /// Whether to throw an exception when webhook API version doesn't match SDK version.
    /// Set to false for development (Stripe CLI uses latest version).
    /// Set to true for production (configure webhook in Stripe Dashboard to use SDK's API version).
    /// </summary>
    public bool ThrowOnApiVersionMismatch { get; set; } = false;
}
