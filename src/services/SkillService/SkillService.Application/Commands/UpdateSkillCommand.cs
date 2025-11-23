using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

public record UpdateSkillCommand(
    string SkillId,
    string Name,
    string Description,
    string CategoryId,
    string ProficiencyLevelId,
    List<string> Tags,
    bool IsOffered,
    int? AvailableHours = null,
    int? PreferredSessionDuration = 60,
    bool? IsActive = null)
    : ICommand<UpdateSkillResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    // ICacheInvalidatingCommand implementation
    // Invalidate specific skill cache and all search caches
    public string[] InvalidationPatterns => new[]
    {
        "skills-search:*",
        "user-skills:*",
        "skill-details:*"
    };
}

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

        RuleFor(x => x.AvailableHours)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours")
            .When(x => x.AvailableHours.HasValue);
    }
}