using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record UnblockUserCommand(
    string UserId,
    string BlockedUserId)
    : ICommand<UnblockUserResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class UnblockUserCommandValidator : AbstractValidator<UnblockUserCommand>
{
    public UnblockUserCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
        
        RuleFor(x => x.BlockedUserId)
            .NotEmpty().WithMessage("Blocked user ID is required");
    }
}
