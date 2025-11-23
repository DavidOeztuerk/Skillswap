using FluentValidation;
using VideocallService.Application.Commands;

namespace VideocallService.Application.Validators;

public class EndCallCommandValidator : AbstractValidator<EndCallCommand>
{
    public EndCallCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("Session ID is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.DurationSeconds)
            .GreaterThan(0).WithMessage("Duration must be greater than 0 seconds")
            .LessThanOrEqualTo(36000).WithMessage("Duration cannot exceed 10 hours");

        When(x => x.Rating.HasValue, () =>
        {
            RuleFor(x => x.Rating!.Value)
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");
        });

        When(x => !string.IsNullOrEmpty(x.Feedback), () =>
        {
            RuleFor(x => x.Feedback)
                .MaximumLength(2000).WithMessage("Feedback cannot exceed 2000 characters");
        });
    }
}
