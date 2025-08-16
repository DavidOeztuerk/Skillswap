using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class BulkUserActionCommand : ICommand<object>
{
    public List<string> UserIds { get; set; } = [];
    public string? Action { get; set; }
    public string? Reason { get; set; }
}