using CQRS.Interfaces;
using FluentValidation;

namespace MatchmakingService.Application.Commands;

public record RejectDirectMatchRequestCommand(
    string RequestId,
    string? ResponseMessage = null)
    : ICommand<DirectMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RejectDirectMatchRequestCommandValidator : AbstractValidator<RejectDirectMatchRequestCommand>
{
    public RejectDirectMatchRequestCommandValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("Request ID is required");

        RuleFor(x => x.ResponseMessage)
            .MaximumLength(500).WithMessage("Response message cannot exceed 500 characters");
    }
}