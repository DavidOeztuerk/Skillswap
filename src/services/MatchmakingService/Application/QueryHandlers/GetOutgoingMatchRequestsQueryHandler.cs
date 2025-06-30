using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Services;
using MatchmakingService.Application.Commands;
using MatchmakingService.Application.Queries;

namespace MatchmakingService.Application.QueryHandlers;

public class GetOutgoingMatchRequestsQueryHandler(
    MatchmakingDbContext dbContext,
    IUserLookupService userLookup,
    ILogger<GetUserMatchesQueryHandler> logger)
    : BasePagedQueryHandler<GetOutgoingMatchRequestsQuery, MatchRequestResponse>(logger)
{
    public override async Task<PagedResponse<MatchRequestResponse>> Handle(GetOutgoingMatchRequestsQuery request, CancellationToken cancellationToken)
    {
        return Success(new List<MatchRequestResponse>
        {
            new MatchRequestResponse(
                RequestId: "",
                RequesterId: string.Empty,
                SkillId: string.Empty,
                Description: "",
                Message: string.Empty,
                Status: string.Empty,
                CreatedAt: DateTime.UtcNow,
                RespondedAt: null,
                ExpiresAt: null
            )
        }, request.PageNumber, request.PageSize, 0);
    }
}