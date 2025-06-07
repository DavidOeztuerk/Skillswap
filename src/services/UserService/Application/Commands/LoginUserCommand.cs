using FluentValidation;
using CQRS.Interfaces;
using Infrastructure.Security;

namespace UserService.Application.Commands;

// ============================================================================
// LOGIN USER COMMAND
// ============================================================================

public record LoginUserCommand(
    string Email,
    string Password,
    string? DeviceInfo = null,
    string? IpAddress = null) 
    : ICommand<LoginUserResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record LoginUserResponse(
    string UserId,
    TokenResult Tokens,
    UserProfileData Profile,
    bool RequiresEmailVerification,
    bool RequiresTwoFactor,
    DateTime LastLoginAt);

public record UserProfileData(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus,
    DateTime CreatedAt,
    DateTime? LastLoginAt);

public class LoginUserCommandValidator : AbstractValidator<LoginUserCommand>
{
    public LoginUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");

        RuleFor(x => x.DeviceInfo)
            .MaximumLength(500).WithMessage("Device info must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.DeviceInfo));
    }
}