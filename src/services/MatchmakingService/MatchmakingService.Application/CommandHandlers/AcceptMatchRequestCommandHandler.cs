using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using CQRS.Models;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Events.Domain.Matchmaking;
using MassTransit;
using Events.Integration.Matchmaking;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.CommandHandlers;

public class AcceptMatchRequestCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<AcceptMatchRequestCommandHandler> logger)
    : BaseCommandHandler<AcceptMatchRequestCommand, bool>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<ApiResponse<bool>> Handle(
        AcceptMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        {
            var matchRequest = await _unitOfWork.MatchRequests.Query
                .FirstOrDefaultAsync(mr => mr.Id == request.RequestId, cancellationToken);

            if (matchRequest == null)
            {
                return Error("Match request not found", ErrorCodes.ResourceNotFound);
            }

            if (matchRequest.Status != MatchRequestStatus.Pending)
            {
                return Error("Match request is no longer pending", ErrorCodes.InvalidOperation);
            }

            // Accept the request
            matchRequest.Accept(request.ResponseMessage);

            // Create a Match entity from the accepted request
            // All details (skills, exchange, monetary, preferences) come from the MatchRequest via navigation property
            var match = Match.CreateFromAcceptedRequest(matchRequest);

            await _unitOfWork.Matches.CreateAsync(match, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Cache invalidation is handled automatically by CacheInvalidationBehavior
            // via ICacheInvalidatingCommand interface on AcceptMatchRequestCommand

            // Publish domain event
            await _eventPublisher.Publish(
                new DirectMatchRequestAcceptedDomainEvent(
                    matchRequest.Id,
                    match.Id,
                    matchRequest.RequesterId,
                    matchRequest.TargetUserId,
                    matchRequest.SkillId),
                cancellationToken);

            // Fetch names from services
            var requesterName = await _userServiceClient.GetUserNameAsync(matchRequest.RequesterId, cancellationToken);
            var targetUserName = await _userServiceClient.GetUserNameAsync(matchRequest.TargetUserId, cancellationToken);
            var skillName = await _skillServiceClient.GetSkillNameAsync(matchRequest.SkillId, cancellationToken);
            var exchangeSkillName = matchRequest.ExchangeSkillId != null 
                ? await _skillServiceClient.GetSkillNameAsync(matchRequest.ExchangeSkillId, cancellationToken)
                : null;

            // Publish integration event for other services
            var integrationEvent = new MatchAcceptedIntegrationEvent(
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
            );

            await _publishEndpoint.Publish(integrationEvent, cancellationToken);
            Logger.LogInformation("Published MatchAcceptedIntegrationEvent for Match: {MatchId}", match.Id);

            return Success(true, "Match request accepted and match created successfully");
        }
    }
}