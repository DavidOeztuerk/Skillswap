using FluentValidation;
using Contracts.User.Requests;
using Contracts.Validation.Common;

namespace Contracts.Validation.User;

/// <summary>
/// Validator for user registration requests
/// </summary>
public class RegisterUserRequestValidator : AbstractValidator<RegisterUserRequest>
{
    public RegisterUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .SetValidator(new EmailValidator());

        RuleFor(x => x.Password)
            .SetValidator(new PasswordValidator());

        RuleFor(x => x.FirstName)
            .SetValidator(new PersonNameValidator())
            .WithName("First name");

        RuleFor(x => x.LastName)
            .SetValidator(new PersonNameValidator())
            .WithName("Last name");

        RuleFor(x => x.UserName)
            .SetValidator(new UsernameValidator());

        // RuleFor(x => x.ReferralCode)
        //     .MaximumLength(50)
        //     .WithMessage("Referral code must not exceed 50 characters")
        //     .When(x => !string.IsNullOrEmpty(x.ReferralCode));
    }
}