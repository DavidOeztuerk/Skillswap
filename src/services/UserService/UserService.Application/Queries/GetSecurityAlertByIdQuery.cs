using CQRS.Interfaces;
using Contracts.Admin.Responses;

namespace UserService.Application.Queries;

public class GetSecurityAlertByIdQuery : IQuery<SecurityAlertResponse>
{
    public string AlertId { get; set; } = string.Empty;
}
