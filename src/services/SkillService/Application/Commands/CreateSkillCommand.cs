using FluentValidation;
using CQRS.Interfaces;

namespace SkillService.Application.Commands;

// ============================================================================
// SKILL MANAGEMENT COMMANDS
// ============================================================================

public record CreateSkillCommand(
    string Name,
    string Description,
    bool IsOffering,
    string SkillCategoryId,
    string ProficiencyLevelId,
    List<string>? Tags = null,
    int? EstimatedDurationMinutes = null,
    string? Requirements = null,
    string? Location = null,
    bool IsRemoteAvailable = true) : ICommand<CreateSkillResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record CreateSkillResponse(
    string SkillId,
    string Name,
    string Description,
    bool IsOffering,
    DateTime CreatedAt);

public class CreateSkillCommandValidator : AbstractValidator<CreateSkillCommand>
{
    public CreateSkillCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Skill name is required")
            .Length(3, 100).WithMessage("Skill name must be between 3 and 100 characters")
            .Matches(@"^[a-zA-Z0-9\s\-\.\+\#]+$").WithMessage("Skill name contains invalid characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .Length(10, 2000).WithMessage("Description must be between 10 and 2000 characters");

        RuleFor(x => x.SkillCategoryId)
            .NotEmpty().WithMessage("Skill category is required");

        RuleFor(x => x.ProficiencyLevelId)
            .NotEmpty().WithMessage("Proficiency level is required");

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags allowed")
            .Must(tags => tags == null || tags.All(tag => tag.Length <= 50))
            .WithMessage("Each tag must be 50 characters or less");

        RuleFor(x => x.EstimatedDurationMinutes)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours")
            .When(x => x.EstimatedDurationMinutes.HasValue);

        RuleFor(x => x.Requirements)
            .MaximumLength(1000).WithMessage("Requirements must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Requirements));

        RuleFor(x => x.Location)
            .MaximumLength(200).WithMessage("Location must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Location));
    }
}
