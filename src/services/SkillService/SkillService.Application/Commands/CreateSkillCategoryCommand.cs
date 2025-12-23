using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

public record CreateSkillCategoryCommand(
    string Name,
    string? Description = null,
    string? IconName = null,
    string? Color = null,
    int SortOrder = 0,
    bool IsActive = true)
    : ICommand<CreateSkillCategoryResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "skill-categories:*",
        "skills:*"  // Categories affect skill queries
    };
}

public class CreateSkillCategoryCommandValidator : AbstractValidator<CreateSkillCategoryCommand>
{
    public CreateSkillCategoryCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required")
            .Length(2, 50).WithMessage("Category name must be between 2 and 50 characters")
            .Matches(@"^[a-zA-Z0-9\s\-\&]+$").WithMessage("Category name contains invalid characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.IconName)
            .MaximumLength(50).WithMessage("Icon name must not exceed 50 characters")
            .When(x => !string.IsNullOrEmpty(x.IconName));

        RuleFor(x => x.Color)
            .Matches(@"^#[0-9A-Fa-f]{6}$").WithMessage("Color must be a valid hex color code")
            .When(x => !string.IsNullOrEmpty(x.Color));

        RuleFor(x => x.SortOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Sort order must be non-negative");
    }
}
