using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

// ============================================================================
// REQUEST PASSWORD RESET COMMAND
// ============================================================================

public record RequestPasswordResetCommand(
    string Email)
    : ICommand<RequestPasswordResetResponse>
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record RequestPasswordResetResponse(
    bool Success,
    string Message);

public class RequestPasswordResetCommandValidator : AbstractValidator<RequestPasswordResetCommand>
{
    public RequestPasswordResetCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}