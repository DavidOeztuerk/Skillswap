using FluentValidation;
using VideocallService.Application.Commands;

namespace VideocallService.Application.Validators;

public class JoinCallCommandValidator : AbstractValidator<JoinCallCommand>
{
    public JoinCallCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("Session ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
