using CQRS.Handlers;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using EventSourcing;
using Contracts.Matchmaking.Responses;
using Events.Domain.Matchmaking;
using Events.Integration.Matchmaking;
using MatchmakingService.Infrastructure.HttpClients;
using MassTransit;
using CQRS.Models;
using Core.Common.Exceptions;

namespace MatchmakingService.Application.CommandHandlers;

public class AcceptMatchCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<AcceptMatchCommandHandler> logger)
    : BaseCommandHandler<AcceptMatchCommand, AcceptMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<ApiResponse<AcceptMatchResponse>> Handle(
        AcceptMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

        if (match == null)
        {
            return Error("Match not found", ErrorCodes.ResourceNotFound);
        }

        var matchRequest = match.AcceptedMatchRequest;

        var requesterName = await _userServiceClient.GetUserNameAsync(matchRequest.RequesterId, cancellationToken);
        var targetUserName = await _userServiceClient.GetUserNameAsync(matchRequest.TargetUserId, cancellationToken);
        var skillName = await _skillServiceClient.GetSkillNameAsync(matchRequest.SkillId, cancellationToken);
        var exchangeSkillName = matchRequest.ExchangeSkillId != null
            ? await _skillServiceClient.GetSkillNameAsync(matchRequest.ExchangeSkillId, cancellationToken)
            : null;

        await _publishEndpoint.Publish(new MatchAcceptedIntegrationEvent(
            matchId: match.Id,
            requestId: matchRequest.Id,
            requesterId: matchRequest.RequesterId,
            requesterName: requesterName,
            targetUserId: matchRequest.TargetUserId,
            targetUserName: targetUserName,
            skillId: matchRequest.SkillId,
            skillName: skillName,
            isSkillExchange: matchRequest.IsSkillExchange,
            exchangeSkillId: matchRequest.ExchangeSkillId,
            exchangeSkillName: exchangeSkillName,
            isMonetary: matchRequest.IsMonetaryOffer,
            agreedAmount: matchRequest.OfferedAmount,
            currency: matchRequest.Currency,
            sessionDurationMinutes: matchRequest.SessionDurationMinutes ?? 60,
            totalSessions: matchRequest.TotalSessions ?? 1,
            preferredDays: matchRequest.PreferredDays?.ToArray() ?? Array.Empty<string>(),
            preferredTimes: matchRequest.PreferredTimes?.ToArray() ?? Array.Empty<string>(),
            threadId: matchRequest.ThreadId ?? "",
            acceptedAt: match.AcceptedAt ?? DateTime.UtcNow
        ), cancellationToken);

        Logger.LogInformation("Published MatchAcceptedIntegrationEvent for Match: {MatchId}", match.Id);

        return Success(new AcceptMatchResponse(
            match.Id,
            match.Status,
            match.AcceptedAt!.Value));
    }
}
