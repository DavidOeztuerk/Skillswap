using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record BlockUserCommand(
    string UserId,
    string BlockedUserId,
    string? Reason = null)
    : ICommand<BlockUserResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record BlockUserResponse(
    string UserId,
    string BlockedUserId,
    DateTime BlockedAt,
    string Message);

public class BlockUserCommandValidator : AbstractValidator<BlockUserCommand>
{
    public BlockUserCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
        
        RuleFor(x => x.BlockedUserId)
            .NotEmpty().WithMessage("Blocked user ID is required");
        
        RuleFor(x => x)
            .Must(x => x.UserId != x.BlockedUserId)
            .WithMessage("Cannot block yourself");
        
        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Reason));
    }
}
