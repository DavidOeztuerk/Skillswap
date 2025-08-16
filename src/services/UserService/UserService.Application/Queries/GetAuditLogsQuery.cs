using CQRS.Interfaces;
using UserService.Application.Commands;

namespace UserService.Application.Queries;

public class GetAuditLogsQuery : IPagedQuery<AuditLogResponse>
{
    public string? Action { get; set; }
    public string? User { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }

}