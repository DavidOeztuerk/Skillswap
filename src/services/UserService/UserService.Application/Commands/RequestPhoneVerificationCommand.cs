using CQRS.Interfaces;

namespace UserService.Application.Commands;

public record RequestPhoneVerificationCommand(
    string PhoneNumber)
    : ICommand<string>
{
    public string? UserId { get; set; }
}