using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record GenerateTwoFactorSecretCommand() : ICommand<GenerateTwoFactorSecretResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record GenerateTwoFactorSecretResponse(
    string Secret);

public class GenerateTwoFactorSecretCommandValidator : AbstractValidator<GenerateTwoFactorSecretCommand>
{
    public GenerateTwoFactorSecretCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}
