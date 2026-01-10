using FluentValidation;
using PaymentService.Application.Commands;

namespace PaymentService.Application.Validators;

public class CreateCheckoutSessionCommandValidator : AbstractValidator<CreateCheckoutSessionCommand>
{
    public CreateCheckoutSessionCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.SuccessUrl)
            .NotEmpty().WithMessage("Success URL is required")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Success URL must be a valid URL");

        RuleFor(x => x.CancelUrl)
            .NotEmpty().WithMessage("Cancel URL is required")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Cancel URL must be a valid URL");
    }
}
