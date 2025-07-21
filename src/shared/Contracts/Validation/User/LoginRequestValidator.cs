using FluentValidation;
using Contracts.User.Requests;
using Contracts.Validation.Common;

namespace Contracts.Validation.User;

/// <summary>
/// Validator for user login requests
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .SetValidator(new EmailValidator());

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password is required");

        RuleFor(x => x.TwoFactorCode)
            .Length(6)
            .WithMessage("Two-factor code must be 6 digits")
            .Matches(@"^\d{6}$")
            .WithMessage("Two-factor code must contain only digits")
            .When(x => !string.IsNullOrEmpty(x.TwoFactorCode));

        RuleFor(x => x.DeviceId)
            .MaximumLength(100)
            .WithMessage("Device ID must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.DeviceId));

        RuleFor(x => x.DeviceInfo)
            .MaximumLength(500)
            .WithMessage("Device info must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.DeviceInfo));
    }
}