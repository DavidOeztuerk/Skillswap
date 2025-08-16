using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record CreateCounterOfferCommand(
    string OriginalRequestId,
    string Message,
    bool IsSkillExchange = false,
    string? ExchangeSkillId = null,
    string? ExchangeSkillName = null,
    bool IsMonetary = false,
    decimal? OfferedAmount = null,
    string? Currency = null,
    List<string>? PreferredDays = null,
    List<string>? PreferredTimes = null,
    int? SessionDurationMinutes = null,
    int? TotalSessions = null)
    : ICommand<CreateMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class CreateCounterOfferCommandValidator : AbstractValidator<CreateCounterOfferCommand>
{
    public CreateCounterOfferCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.OriginalRequestId)
            .NotEmpty().WithMessage("Original Request ID is required");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .Length(10, 500).WithMessage("Message must be between 10 and 500 characters");

        RuleFor(x => x.OfferedAmount)
            .GreaterThan(0).When(x => x.IsMonetary)
            .WithMessage("Offered amount must be greater than 0 when monetary offer is selected");

        RuleFor(x => x.ExchangeSkillId)
            .NotEmpty().When(x => x.IsSkillExchange)
            .WithMessage("Exchange skill ID is required when skill exchange is selected");

        RuleFor(x => x.SessionDurationMinutes)
            .InclusiveBetween(15, 480).When(x => x.SessionDurationMinutes.HasValue)
            .WithMessage("Session duration must be between 15 and 480 minutes");

        RuleFor(x => x.TotalSessions)
            .InclusiveBetween(1, 20).When(x => x.TotalSessions.HasValue)
            .WithMessage("Total sessions must be between 1 and 20");

        RuleFor(x => x.PreferredDays)
            .Must(days => days == null || days.Count > 0)
            .WithMessage("At least one preferred day must be selected");

        RuleFor(x => x.PreferredTimes)
            .Must(times => times == null || times.Count > 0)
            .WithMessage("At least one preferred time must be selected");
    }
}