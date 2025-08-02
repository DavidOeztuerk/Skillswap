// using CQRS.Interfaces;
// using FluentValidation;

// namespace MatchmakingService.Application.Commands;

// public record CreateCounterOfferCommand(
//     string RequestId,
//     string Message,
//     bool IsSkillExchange = false,
//     string? ExchangeSkillId = null,
//     string? ExchangeSkillName = null,
//     bool IsMonetaryOffer = false,
//     decimal? OfferedAmount = null,
//     List<string>? PreferredDays = null,
//     List<string>? PreferredTimes = null,
//     int? SessionDurationMinutes = null,
//     int? TotalSessions = null)
//     : ICommand<CounterOfferResponse>, IAuditableCommand
// {
//     public string? UserId { get; set; }
//     public DateTime Timestamp { get; set; } = DateTime.UtcNow;
// }

// public record CounterOfferResponse(
//     string Id,
//     string RequestId,
//     string RequesterId,
//     string Message,
//     bool IsSkillExchange,
//     string? ExchangeSkillId,
//     string? ExchangeSkillName,
//     bool IsMonetaryOffer,
//     decimal? OfferedAmount,
//     List<string> PreferredDays,
//     List<string> PreferredTimes,
//     int SessionDurationMinutes,
//     int TotalSessions,
//     string Status,
//     DateTime CreatedAt);

// public class CreateCounterOfferCommandValidator : AbstractValidator<CreateCounterOfferCommand>
// {
//     public CreateCounterOfferCommandValidator()
//     {
//         RuleFor(x => x.UserId)
//             .NotEmpty().WithMessage("User ID is required");

//         RuleFor(x => x.RequestId)
//             .NotEmpty().WithMessage("Request ID is required");

//         RuleFor(x => x.Message)
//             .NotEmpty().WithMessage("Message is required")
//             .Length(10, 500).WithMessage("Message must be between 10 and 500 characters");

//         RuleFor(x => x.OfferedAmount)
//             .GreaterThan(0).When(x => x.IsMonetaryOffer)
//             .WithMessage("Offered amount must be greater than 0 when monetary offer is selected");

//         RuleFor(x => x.ExchangeSkillId)
//             .NotEmpty().When(x => x.IsSkillExchange)
//             .WithMessage("Exchange skill ID is required when skill exchange is selected");

//         RuleFor(x => x.SessionDurationMinutes)
//             .GreaterThan(0).WithMessage("Session duration must be greater than 0");

//         RuleFor(x => x.TotalSessions)
//             .GreaterThan(0).WithMessage("Total sessions must be greater than 0");
//     }
// }