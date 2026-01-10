using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PaymentService.Application.Services;
using Stripe;
using Stripe.Checkout;

namespace PaymentService.Infrastructure.Services;

public class StripeService : IStripeService
{
    private readonly StripeSettings _settings;
    private readonly ILogger<StripeService> _logger;

    public StripeService(IOptions<StripeSettings> settings, ILogger<StripeService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        StripeConfiguration.ApiKey = _settings.SecretKey;
    }

    public async Task<StripeCheckoutResult> CreateCheckoutSessionAsync(
        string productName,
        decimal amount,
        string currency,
        string successUrl,
        string cancelUrl,
        Dictionary<string, string> metadata,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating Stripe checkout session for product {ProductName}, amount {Amount} {Currency}",
            productName, amount, currency);

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = ["card"],
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = currency.ToLower(),
                        UnitAmount = (long)(amount * 100), // Convert to cents
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = productName
                        }
                    },
                    Quantity = 1
                }
            ],
            Mode = "payment",
            SuccessUrl = successUrl + (successUrl.Contains('?') ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
            Metadata = metadata
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options, cancellationToken: cancellationToken);

        _logger.LogInformation("Stripe checkout session created: {SessionId}", session.Id);

        return new StripeCheckoutResult(session.Id, session.Url!);
    }

    public StripeWebhookResult ConstructWebhookEvent(string json, string signature)
    {
        // In Development: Stripe CLI uses latest API version, causing mismatch with SDK
        // In Production: Configure webhook in Stripe Dashboard to use SDK's API version
        // Set ThrowOnApiVersionMismatch=true in prod for strict validation
        var stripeEvent = EventUtility.ConstructEvent(
            json,
            signature,
            _settings.WebhookSecret,
            throwOnApiVersionMismatch: _settings.ThrowOnApiVersionMismatch);

        string? sessionId = null;
        string? paymentIntentId = null;
        var metadata = new Dictionary<string, string>();

        if (stripeEvent.Data.Object is Session session)
        {
            sessionId = session.Id;
            paymentIntentId = session.PaymentIntentId;
            if (session.Metadata != null)
            {
                foreach (var kvp in session.Metadata)
                {
                    metadata[kvp.Key] = kvp.Value;
                }
            }
        }

        return new StripeWebhookResult(
            stripeEvent.Type,
            sessionId,
            paymentIntentId,
            metadata);
    }
}
