using CQRS.Interfaces;
using Contracts.Admin.Responses;

namespace UserService.Application.Queries;

public class GetSecurityAlertsQuery : IPagedQuery<SecurityAlertResponse>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? MinLevel { get; set; }
    public string? Type { get; set; }
    public bool IncludeRead { get; set; } = true;
    public bool IncludeDismissed { get; set; } = false;
}
