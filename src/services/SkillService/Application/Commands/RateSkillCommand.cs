using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

public record RateSkillCommand(
    string SkillId,
    int Rating, // 1-5 stars
    string? Comment = null,
    List<string>? Tags = null)
    : ICommand<RateSkillResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RateSkillCommandValidator : AbstractValidator<RateSkillCommand>
{
    public RateSkillCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Comment)
            .MaximumLength(1000).WithMessage("Comment must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Comment));

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 5)
            .WithMessage("Maximum 5 tags allowed for rating");

        // Note: Self-rating check will be done in the handler
        // after fetching the skill to get the owner's UserId
    }
}
