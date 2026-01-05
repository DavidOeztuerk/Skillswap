using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

public record AddFavoriteCommand(string SkillId)
    : ICommand<AddFavoriteResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class AddFavoriteCommandValidator : AbstractValidator<AddFavoriteCommand>
{
    public AddFavoriteCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");
    }
}
