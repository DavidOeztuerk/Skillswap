using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record RejectMatchRequestCommand(
    string RequestId,
    string? ResponseMessage = null)
    : ICommand<MatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RejectMatchRequestCommandValidator : AbstractValidator<RejectMatchRequestCommand>
{
    public RejectMatchRequestCommandValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("Request ID is required");

        RuleFor(x => x.ResponseMessage)
            .MaximumLength(500).WithMessage("Response message cannot exceed 500 characters");
    }
}
