using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

// ============================================================================
// UPDATE SKILL CATEGORY COMMAND
// ============================================================================

public record UpdateSkillCategoryCommand(
    string CategoryId,
    string? Name = null,
    string? Description = null,
    string? IconName = null,
    string? Color = null,
    int? SortOrder = null,
    bool? IsActive = null)
    : ICommand<UpdateSkillCategoryResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record UpdateSkillCategoryResponse(
    string CategoryId,
    string Name,
    DateTime UpdatedAt);

public class UpdateSkillCategoryCommandValidator : AbstractValidator<UpdateSkillCategoryCommand>
{
    public UpdateSkillCategoryCommandValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required");

        RuleFor(x => x.Name)
            .Length(2, 50).WithMessage("Category name must be between 2 and 50 characters")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Color)
            .Matches(@"^#[0-9A-Fa-f]{6}$").WithMessage("Color must be a valid hex color code")
            .When(x => !string.IsNullOrEmpty(x.Color));
    }
}
