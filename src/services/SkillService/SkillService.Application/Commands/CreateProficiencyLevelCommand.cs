using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

public record CreateProficiencyLevelCommand(
    string Level,
    string? Description = null,
    int Rank = 1,
    string? Color = null,
    bool IsActive = true)
    : ICommand<CreateProficiencyLevelResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "proficiency-levels:*",
        "skill-categories"
    };
}

public class CreateProficiencyLevelCommandValidator : AbstractValidator<CreateProficiencyLevelCommand>
{
    public CreateProficiencyLevelCommandValidator()
    {
        RuleFor(x => x.Level)
            .NotEmpty().WithMessage("Level name is required")
            .Length(2, 30).WithMessage("Level name must be between 2 and 30 characters")
            .Matches(@"^[a-zA-Z\s\-]+$").WithMessage("Level name contains invalid characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Rank)
            .GreaterThan(0).WithMessage("Rank must be greater than 0")
            .LessThanOrEqualTo(10).WithMessage("Rank cannot exceed 10");

        RuleFor(x => x.Color)
            .Matches(@"^#[0-9A-Fa-f]{6}$").WithMessage("Color must be a valid hex color code")
            .When(x => !string.IsNullOrEmpty(x.Color));
    }
}
