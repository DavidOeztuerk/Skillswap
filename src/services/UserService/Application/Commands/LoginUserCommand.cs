using FluentValidation;
using CQRS.Interfaces;
using Contracts.User.Requests;
using Contracts.User.Responses.Auth;

namespace UserService.Application.Commands;


public record LoginUserCommand(
    string Email,
    string Password,
    string? TwoFactorCode = null,
    string? DeviceId = null,
    string? DeviceInfo = null)
    : ICommand<LoginResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

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

        RuleFor(x => x.TwoFactorCode)
            .Matches("^\\d{6}$").WithMessage("Two factor code must be 6 digits")
            .When(x => !string.IsNullOrEmpty(x.TwoFactorCode));
    }
}