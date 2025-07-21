using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record VerifyEmailCommand(
    string Email,
    string VerificationToken)
    : ICommand<VerifyEmailResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

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