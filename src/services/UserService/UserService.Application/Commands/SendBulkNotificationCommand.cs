using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class SendBulkNotificationCommand : ICommand<object>
{
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? Type { get; set; }
    public List<string>? TargetUsers { get; set; }
    public List<string>? TargetRoles { get; set; }
}