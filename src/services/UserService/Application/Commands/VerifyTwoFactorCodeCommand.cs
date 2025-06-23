using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record VerifyTwoFactorCodeCommand(string UserId, string Code) : ICommand<VerifyTwoFactorCodeResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record VerifyTwoFactorCodeResponse(bool Success);

public class VerifyTwoFactorCodeCommandValidator : AbstractValidator<VerifyTwoFactorCodeCommand>
{
    public VerifyTwoFactorCodeCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty();
    }
}
