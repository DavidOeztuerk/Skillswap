using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

// ============================================================================
// VERIFY EMAIL COMMAND
// ============================================================================

public record VerifyEmailCommand(
    string Email,
    string VerificationToken)
    : ICommand<VerifyEmailResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record VerifyEmailResponse(
    bool Success,
    string Message);

public class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.VerificationToken)
            .NotEmpty().WithMessage("Verification token is required");
    }
}