using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Commands;

public record DeleteAvatarCommand()
    : ICommand<DeleteAvatarResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class DeleteAvatarCommandValidator : AbstractValidator<DeleteAvatarCommand>
{
    public DeleteAvatarCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
