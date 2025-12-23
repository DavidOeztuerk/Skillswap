using Contracts.Chat.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands.Chat;

/// <summary>
/// Command to create a new chat thread (typically from MatchAccepted event)
/// </summary>
public record CreateChatThreadCommand(
    string ThreadId,
    string Participant1Id,
    string Participant2Id,
    string? Participant1Name = null,
    string? Participant2Name = null,
    string? Participant1AvatarUrl = null,
    string? Participant2AvatarUrl = null,
    string? SkillId = null,
    string? SkillName = null,
    string? MatchId = null) : ICommand<ChatThreadResponse>;

public class CreateChatThreadCommandValidator : AbstractValidator<CreateChatThreadCommand>
{
    public CreateChatThreadCommandValidator()
    {
        RuleFor(x => x.ThreadId)
            .NotEmpty().WithMessage("Thread ID is required")
            .MaximumLength(450).WithMessage("Thread ID must not exceed 450 characters");

        RuleFor(x => x.Participant1Id)
            .NotEmpty().WithMessage("Participant 1 ID is required")
            .MaximumLength(450).WithMessage("Participant 1 ID must not exceed 450 characters");

        RuleFor(x => x.Participant2Id)
            .NotEmpty().WithMessage("Participant 2 ID is required")
            .MaximumLength(450).WithMessage("Participant 2 ID must not exceed 450 characters")
            .NotEqual(x => x.Participant1Id).WithMessage("Participants must be different users");

        RuleFor(x => x.Participant1Name)
            .MaximumLength(200).WithMessage("Participant 1 name must not exceed 200 characters");

        RuleFor(x => x.Participant2Name)
            .MaximumLength(200).WithMessage("Participant 2 name must not exceed 200 characters");

        RuleFor(x => x.SkillId)
            .MaximumLength(450).WithMessage("Skill ID must not exceed 450 characters");

        RuleFor(x => x.SkillName)
            .MaximumLength(200).WithMessage("Skill name must not exceed 200 characters");

        RuleFor(x => x.MatchId)
            .MaximumLength(450).WithMessage("Match ID must not exceed 450 characters");
    }
}
