using CQRS.Interfaces;
using Contracts.Admin.Responses;

namespace UserService.Application.Queries;

public class GetSecurityAlertStatisticsQuery : IQuery<SecurityAlertStatisticsResponse>
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}
