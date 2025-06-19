using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

// ============================================================================
// UPDATE SKILL COMMAND
// ============================================================================

public record UpdateSkillCommand(
    string SkillId,
    string? Name = null,
    string? Description = null,
    bool? IsOffering = null,
    string? SkillCategoryId = null,
    string? ProficiencyLevelId = null,
    List<string>? Tags = null,
    int? EstimatedDurationMinutes = null,
    string? Requirements = null,
    string? Location = null,
    bool? IsRemoteAvailable = null,
    bool? IsActive = null)
    : ICommand<UpdateSkillResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record UpdateSkillResponse(
    string SkillId,
    string Name,
    DateTime UpdatedAt);

public class UpdateSkillCommandValidator : AbstractValidator<UpdateSkillCommand>
{
    public UpdateSkillCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.Name)
            .Length(3, 100).WithMessage("Skill name must be between 3 and 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Description)
            .Length(10, 2000).WithMessage("Description must be between 10 and 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags allowed")
            .When(x => x.Tags != null);

        RuleFor(x => x.EstimatedDurationMinutes)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours")
            .When(x => x.EstimatedDurationMinutes.HasValue);
    }
}