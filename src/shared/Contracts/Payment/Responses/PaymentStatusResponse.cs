namespace Contracts.Payment.Responses;

public record PaymentStatusResponse(
    string PaymentId,
    string Status,
    bool IsCompleted,
    DateTime? CompletedAt);
