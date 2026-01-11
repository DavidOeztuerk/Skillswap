using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

public record AddFavoriteCommand(string SkillId)
    : ICommand<AddFavoriteResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ICacheInvalidatingCommand implementation
    public string[] InvalidationPatterns =>
    [
        $"favorite-skills:{UserId}:*",
        $"is-favorite:{UserId}:{SkillId}"
    ];
}

public class AddFavoriteCommandValidator : AbstractValidator<AddFavoriteCommand>
{
    public AddFavoriteCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");
    }
}
