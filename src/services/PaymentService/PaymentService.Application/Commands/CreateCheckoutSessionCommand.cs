using CQRS.Interfaces;
using Contracts.Payment.Responses;

namespace PaymentService.Application.Commands;

public record CreateCheckoutSessionCommand(
    string ProductId,
    string? ReferenceId,
    string? ReferenceType,
    string SuccessUrl,
    string CancelUrl)
    : ICommand<CheckoutSessionResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
