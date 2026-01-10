namespace Contracts.Events;

/// <summary>
/// Integration event published when a payment succeeds
/// </summary>
public record PaymentSucceededIntegrationEvent(
    string PaymentId,
    string UserId,
    string ProductId,
    string ProductType,
    string? ReferenceId,
    string? ReferenceType,
    string BoostType,
    int DurationDays,
    decimal Amount,
    string Currency,
    DateTime CompletedAt);
