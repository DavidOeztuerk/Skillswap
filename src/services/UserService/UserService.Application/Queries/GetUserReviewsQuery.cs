using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Queries;

public class GetUserReviewsQuery : IPagedQuery<UserReviewResponse>
{
    public string UserId { get; set; } = string.Empty;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
