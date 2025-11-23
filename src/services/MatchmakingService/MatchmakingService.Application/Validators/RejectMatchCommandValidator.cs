using FluentValidation;
using MatchmakingService.Application.Commands;

namespace MatchmakingService.Application.Validators;

public class RejectMatchCommandValidator : AbstractValidator<RejectMatchCommand>
{
    public RejectMatchCommandValidator()
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        When(x => !string.IsNullOrEmpty(x.Reason), () =>
        {
            RuleFor(x => x.Reason)
                .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters");
        });
    }
}
