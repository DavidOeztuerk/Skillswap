using CQRS.Interfaces;

namespace UserService.Application.Commands;

public record ConfirmPhoneVerificationCommand(
    string VerificationCode)
    : ICommand<bool>
{
    public string? UserId { get; set; }
}