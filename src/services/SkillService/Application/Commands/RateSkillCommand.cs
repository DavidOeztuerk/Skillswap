using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

// ============================================================================
// SKILL RATING COMMAND
// ============================================================================

public record RateSkillCommand(
    string SkillId,
    string RatedUserId, // User who owns the skill
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

        RuleFor(x => x.RatedUserId)
            .NotEmpty().WithMessage("Rated user ID is required");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Comment)
            .MaximumLength(1000).WithMessage("Comment must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Comment));

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 5)
            .WithMessage("Maximum 5 tags allowed for rating");

        RuleFor(x => x)
            .Must(x => x.UserId != x.RatedUserId)
            .WithMessage("Cannot rate your own skill")
            .When(x => !string.IsNullOrEmpty(x.UserId));
    }
}
