using FluentValidation;
using Contracts.User.Requests;
using Contracts.Validation.Common;

namespace Contracts.Validation.User;

/// <summary>
/// Validator for change password requests
/// </summary>
public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty()
            .WithMessage("Current password is required");

        RuleFor(x => x.NewPassword)
            .SetValidator(new PasswordValidator());

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty()
            .WithMessage("Password confirmation is required")
            .Equal(x => x.NewPassword)
            .WithMessage("Password confirmation must match the new password");
    }
}