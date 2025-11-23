namespace Contracts.Appointment.Responses;

public record PaymentResponse(
    string PaymentId,
    string Status,
    decimal Amount,
    string Currency,
    string? TransactionId,
    DateTime? ProcessedAt);
