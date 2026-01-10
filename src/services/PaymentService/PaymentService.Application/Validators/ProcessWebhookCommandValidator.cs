using FluentValidation;
using PaymentService.Application.Commands;

namespace PaymentService.Application.Validators;

public class ProcessWebhookCommandValidator : AbstractValidator<ProcessWebhookCommand>
{
    public ProcessWebhookCommandValidator()
    {
        RuleFor(x => x.Json)
            .NotEmpty().WithMessage("Webhook JSON payload is required");

        RuleFor(x => x.Signature)
            .NotEmpty().WithMessage("Stripe signature is required");
    }
}
