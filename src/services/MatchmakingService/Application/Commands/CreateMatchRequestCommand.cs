using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record CreateMatchRequestCommand(
    string SkillId,
    string TargetUserId,
    string Message,
    bool IsSkillExchange = false,
    string? ExchangeSkillId = null,
    bool IsMonetary = false,
    decimal? OfferedAmount = null,
    string Currency = "EUR",
    int SessionDurationMinutes = 60,
    int TotalSessions = 1,
    string[]? PreferredDays = null,
    string[]? PreferredTimes = null)
    : ICommand<CreateMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    // Helper properties for backward compatibility
    public string? Description => Message;
}

public class CreateMatchRequestCommandValidator : AbstractValidator<CreateMatchRequestCommand>
{
    public CreateMatchRequestCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("Target User ID is required");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .Length(5, 500).WithMessage("Message must be between 5 and 500 characters");

        RuleFor(x => x)
            .Must(command => command.UserId != command.TargetUserId)
            .WithMessage("Cannot create match request with yourself");
    }
}