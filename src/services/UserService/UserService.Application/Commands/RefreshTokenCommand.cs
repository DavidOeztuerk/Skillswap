using FluentValidation;
using CQRS.Interfaces;
using Contracts.User.Responses;

namespace UserService.Application.Commands;

public record RefreshTokenCommand(
    string AccessToken,
    string RefreshToken)
    : ICommand<RefreshTokenResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.AccessToken)
            .NotEmpty().WithMessage("Access token is required");

        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}
