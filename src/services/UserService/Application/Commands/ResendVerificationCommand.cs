using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record ResendVerificationCommand(
    string Email)
    : ICommand<ResendVerificationResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record ResendVerificationResponse(
    bool Success,
    string Message);

public class ResendVerificationCommandValidator : AbstractValidator<ResendVerificationCommand>
{
    public ResendVerificationCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}
