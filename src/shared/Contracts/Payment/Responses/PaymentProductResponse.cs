namespace Contracts.Payment.Responses;

public record PaymentProductResponse(
    string Id,
    string Name,
    string Description,
    string ProductType,
    string BoostType,
    decimal Price,
    string Currency,
    int DurationDays);
