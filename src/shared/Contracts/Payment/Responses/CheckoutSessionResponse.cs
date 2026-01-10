namespace Contracts.Payment.Responses;

public record CheckoutSessionResponse(
    string PaymentId,
    string CheckoutUrl);
