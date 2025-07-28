using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record AcceptDirectMatchRequestCommand(
    string RequestId,
    string? ResponseMessage = null)
    : ICommand<DirectMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class AcceptDirectMatchRequestCommandValidator : AbstractValidator<AcceptDirectMatchRequestCommand>
{
    public AcceptDirectMatchRequestCommandValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("Request ID is required");

        RuleFor(x => x.ResponseMessage)
            .MaximumLength(500).WithMessage("Response message cannot exceed 500 characters");
    }
}