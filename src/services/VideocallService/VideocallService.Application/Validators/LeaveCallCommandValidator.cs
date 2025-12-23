using FluentValidation;
using VideocallService.Application.Commands;

namespace VideocallService.Application.Validators;

public class LeaveCallCommandValidator : AbstractValidator<LeaveCallCommand>
{
    public LeaveCallCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("Session ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
