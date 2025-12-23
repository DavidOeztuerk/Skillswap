using FluentValidation;
using MatchmakingService.Application.Commands;

namespace MatchmakingService.Application.Validators;

public class CompleteMatchCommandValidator : AbstractValidator<CompleteMatchCommand>
{
    public CompleteMatchCommandValidator()
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        When(x => x.Rating.HasValue, () =>
        {
            RuleFor(x => x.Rating!.Value)
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");
        });

        When(x => !string.IsNullOrEmpty(x.CompletionNotes), () =>
        {
            RuleFor(x => x.CompletionNotes)
                .MaximumLength(2000).WithMessage("Completion notes cannot exceed 2000 characters");
        });
    }
}
