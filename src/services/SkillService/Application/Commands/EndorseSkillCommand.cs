using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

// ============================================================================
// SKILL ENDORSEMENT COMMAND
// ============================================================================

public record EndorseSkillCommand(
    string SkillId,
    string EndorsedUserId,
    string? Message = null)
    : ICommand<EndorseSkillResponse>, IAuditableCommand
{
    public string? UserId { get; set; } // User giving the endorsement
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class EndorseSkillCommandValidator : AbstractValidator<EndorseSkillCommand>
{
    public EndorseSkillCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.EndorsedUserId)
            .NotEmpty().WithMessage("Endorsed user ID is required");

        RuleFor(x => x.Message)
            .MaximumLength(500).WithMessage("Message must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Message));

        RuleFor(x => x)
            .Must(x => x.UserId != x.EndorsedUserId)
            .WithMessage("Cannot endorse your own skill")
            .When(x => !string.IsNullOrEmpty(x.UserId));
    }
}
