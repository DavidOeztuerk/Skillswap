using FluentValidation;
using CQRS.Interfaces;
using Infrastructure.Security;

namespace UserService.Application.Commands;

// ============================================================================
// REGISTER USER COMMAND
// ============================================================================

public record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string UserName,
    string? ReferralCode = null)
    : ICommand<RegisterUserResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record RegisterUserResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    TokenResult Tokens,
    bool EmailVerificationRequired);

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$")
            .WithMessage("Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters")
            .Matches(@"^[a-zA-ZäöüÄÖÜß\s\-']+$").WithMessage("First name contains invalid characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters")
            .Matches(@"^[a-zA-ZäöüÄÖÜß\s\-']+$").WithMessage("Last name contains invalid characters");

        RuleFor(x => x.ReferralCode)
            .MaximumLength(50).WithMessage("Referral code must not exceed 50 characters")
            .When(x => !string.IsNullOrEmpty(x.ReferralCode));
    }
}
