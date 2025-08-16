using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record VerifyPhoneCommand(
    string VerificationCode) 
    : ICommand<VerifyPhoneResponse>, IAuditableCommand
{
    public string? UserId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class VerifyPhoneCommandValidator : AbstractValidator<VerifyPhoneCommand>
{
    public VerifyPhoneCommandValidator()
    {
        RuleFor(x => x.VerificationCode)
            .NotEmpty().WithMessage("Verification code is required")
            .Length(6).WithMessage("Verification code must be 6 digits")
            .Matches(@"^\d{6}$").WithMessage("Verification code must contain only digits");
    }
}