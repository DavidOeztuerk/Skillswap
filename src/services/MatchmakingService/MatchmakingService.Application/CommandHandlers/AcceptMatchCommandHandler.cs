using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using EventSourcing;
using Contracts.Matchmaking.Responses;
using Events.Domain.Matchmaking;
using Events.Integration.Matchmaking;
using MassTransit;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.CommandHandlers;

public class AcceptMatchCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<AcceptMatchCommandHandler> logger)
    : BaseCommandHandler<AcceptMatchCommand, AcceptMatchResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<ApiResponse<AcceptMatchResponse>> Handle(
        AcceptMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await _unitOfWork.Matches.Query
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

        // Publish domain event for event sourcing
        await _eventPublisher.Publish(
            new MatchAcceptedDomainEvent(
                match.Id,
                matchRequest.TargetUserId,  // OfferingUserId (who accepted/offered)
                matchRequest.RequesterId,    // RequestingUserId (who requested)
                match.AcceptedAt ?? DateTime.UtcNow),
            cancellationToken);

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
            totalSessions: matchRequest.TotalSessions,
            preferredDays: matchRequest.PreferredDays?.ToArray() ?? Array.Empty<string>(),
            preferredTimes: matchRequest.PreferredTimes?.ToArray() ?? Array.Empty<string>(),
            threadId: matchRequest.ThreadId ?? "",
            acceptedAt: match.AcceptedAt ?? DateTime.UtcNow
        ), cancellationToken);

        Logger.LogInformation("Published MatchAcceptedIntegrationEvent for Match: {MatchId}", match.Id);

        return Success(new AcceptMatchResponse(
            match.Id,
            match.Status.ToString(),
            match.AcceptedAt!.Value));
    }
}
