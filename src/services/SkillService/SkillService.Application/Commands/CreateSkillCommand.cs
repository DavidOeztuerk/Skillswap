using CQRS.Interfaces;
using FluentValidation;
using Contracts.Skill.Responses;

namespace SkillService.Application.Commands;

public record CreateSkillCommand(
    string Name,
    string Description,
    string CategoryId,
    string ProficiencyLevelId,
    List<string> Tags,
    bool IsOffered,
    int? AvailableHours = null,
    int? PreferredSessionDuration = 60)
    : ICommand<CreateSkillResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    // ICacheInvalidatingCommand implementation
    // Invalidate all skill-related caches when a new skill is created
    public string[] InvalidationPatterns => new[]
    {
        "skills-search:*",  // All search queries
        "user-skills:*",    // All user skill lists
        "skill-categories:*" // Category statistics might change
    };
}

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

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Skill category is required");

        RuleFor(x => x.ProficiencyLevelId)
            .NotEmpty().WithMessage("Proficiency level is required");

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags allowed")
            .Must(tags => tags == null || tags.All(tag => tag.Length <= 50))
            .WithMessage("Each tag must be 50 characters or less");

        RuleFor(x => x.AvailableHours)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours")
            .When(x => x.AvailableHours.HasValue);

        RuleFor(x => x.PreferredSessionDuration)
            .GreaterThan(0).WithMessage("Session duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Session duration cannot exceed 8 hours")
            .When(x => x.PreferredSessionDuration.HasValue);
    }
}
