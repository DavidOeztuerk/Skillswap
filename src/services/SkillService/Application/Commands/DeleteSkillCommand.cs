using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

// ============================================================================
// DELETE SKILL COMMAND
// ============================================================================

public record DeleteSkillCommand(
    string SkillId,
    string? Reason = null)
    : ICommand<DeleteSkillResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record DeleteSkillResponse(
    string SkillId,
    bool Success,
    DateTime DeletedAt);

public class DeleteSkillCommandValidator : AbstractValidator<DeleteSkillCommand>
{
    public DeleteSkillCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Reason));
    }
}
