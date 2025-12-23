using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record FindMatchCommand(
    string SkillId,
    string SkillName,
    bool IsOffering,
    List<string>? PreferredTags = null,
    bool RemoteOnly = false,
    int? MaxDistanceKm = null)
    : ICommand<FindMatchResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record FindMatchResponse(
    string? MatchId,
    bool MatchFound,
    string? MatchedWithUserId,
    string? MatchedSkillId,
    double? CompatibilityScore,
    string Message);

public class FindMatchCommandValidator : AbstractValidator<FindMatchCommand>
{
    public FindMatchCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.SkillName)
            .NotEmpty().WithMessage("Skill name is required")
            .Length(2, 100).WithMessage("Skill name must be between 2 and 100 characters");

        RuleFor(x => x.MaxDistanceKm)
            .GreaterThan(0).WithMessage("Max distance must be greater than 0")
            .LessThanOrEqualTo(10000).WithMessage("Max distance cannot exceed 10000 km")
            .When(x => x.MaxDistanceKm.HasValue);

        RuleFor(x => x.PreferredTags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 preferred tags allowed");
    }
}
