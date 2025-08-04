
// using CQRS.Interfaces;
// using FluentValidation;

// namespace UserService.Application.Queries;

// public record ValidateUserCredentialsQuery(
//     string Email,
//     string Password)
//     : IQuery<UserValidationResponse>
// {
//     // No caching for security reasons
// }

// public record UserValidationResponse(
//     bool IsValid,
//     string? UserId,
//     string? Reason,
//     bool RequiresEmailVerification,
//     bool AccountLocked,
//     DateTime? LockoutEndsAt);

// public class ValidateUserCredentialsQueryValidator : AbstractValidator<ValidateUserCredentialsQuery>
// {
//     public ValidateUserCredentialsQueryValidator()
//     {
//         RuleFor(x => x.Email)
//             .NotEmpty().WithMessage("Email is required")
//             .EmailAddress().WithMessage("Invalid email format");

//         RuleFor(x => x.Password)
//             .NotEmpty().WithMessage("Password is required");
//     }
// }
