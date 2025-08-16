using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class ExportUsersQuery : IQuery<ExportResult>
{
    public string? Status { get; set; }
    public string? Role { get; set; }
}