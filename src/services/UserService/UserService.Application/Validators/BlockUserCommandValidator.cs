using FluentValidation;
using UserService.Application.Commands;

namespace UserService.Application.Validators;
public class BlockUserCommandValidator : AbstractValidator<BlockUserCommand>
{
    public BlockUserCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.BlockedUserId)
            .NotEmpty().WithMessage("Blocked user ID is required");

        RuleFor(x => x)
            .Must(x => x.UserId != x.BlockedUserId)
            .WithMessage("Cannot block yourself");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Reason));
    }
}
