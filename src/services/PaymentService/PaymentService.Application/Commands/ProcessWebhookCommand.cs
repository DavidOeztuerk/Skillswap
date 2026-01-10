using CQRS.Interfaces;

namespace PaymentService.Application.Commands;

public record ProcessWebhookCommand(
    string Json,
    string Signature)
    : ICommand<bool>;
