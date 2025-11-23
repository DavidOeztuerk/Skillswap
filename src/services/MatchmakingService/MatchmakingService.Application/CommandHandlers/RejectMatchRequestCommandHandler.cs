using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MassTransit;
using Events.Integration.Matchmaking;
using Core.Common.Exceptions;
using Infrastructure.Caching;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using MatchmakingService.Domain.Services;
using MatchmakingService.Domain.Repositories;

namespace MatchmakingService.Application.CommandHandlers;

public class RejectMatchRequestCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    IDistributedCacheService cacheService,
    ILogger<RejectMatchRequestCommandHandler> logger)
    : BaseCommandHandler<RejectMatchRequestCommand, bool>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;
    private readonly IDistributedCacheService _cacheService = cacheService;

    public override async Task<ApiResponse<bool>> Handle(
        RejectMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        {
            var matchRequest = await _unitOfWork.MatchRequests.Query
                .FirstOrDefaultAsync(mr => mr.Id == request.RequestId, cancellationToken);

            if (matchRequest == null)
            {
                return Error("Match request not found", ErrorCodes.ResourceNotFound);
            }

            if (matchRequest.Status.ToLower() != "pending")
            {
                return Error("Match request is no longer pending", ErrorCodes.InvalidOperation);
            }

            // Reject the request
            matchRequest.Reject(request.ResponseMessage);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // INVALIDATE CACHE for both users - match request status changed
            try
            {
                // Invalidate incoming match requests cache for TargetUser (who rejected)
                await _cacheService.RemoveByPatternAsync(
                    $"matchrequests:incoming:{matchRequest.TargetUserId}:*",
                    cancellationToken);

                // Invalidate outgoing match requests cache for Requester (whose request was rejected)
                await _cacheService.RemoveByPatternAsync(
                    $"matchrequests:outgoing:{matchRequest.RequesterId}:*",
                    cancellationToken);

                Logger.LogInformation(
                    "Invalidated match request cache for users {RequesterId} and {TargetUserId}",
                    matchRequest.RequesterId, matchRequest.TargetUserId);
            }
            catch (Exception ex)
            {
                // Cache invalidation failure should not break the flow
                Logger.LogWarning(ex,
                    "Failed to invalidate match request cache for users {RequesterId} and {TargetUserId}. Cache will expire naturally.",
                    matchRequest.RequesterId, matchRequest.TargetUserId);
            }

            // Fetch names from services
            var requesterName = await _userServiceClient.GetUserNameAsync(matchRequest.RequesterId, cancellationToken);
            var targetUserName = await _userServiceClient.GetUserNameAsync(matchRequest.TargetUserId, cancellationToken);
            var skillName = await _skillServiceClient.GetSkillNameAsync(matchRequest.SkillId, cancellationToken);

            // Publish integration event for notification
            var integrationEvent = new MatchRequestRejectedIntegrationEvent(
                requestId: matchRequest.Id,
                requesterId: matchRequest.RequesterId,
                requesterName: requesterName,
                targetUserId: matchRequest.TargetUserId,
                targetUserName: targetUserName,
                skillId: matchRequest.SkillId,
                skillName: skillName,
                rejectionReason: request.ResponseMessage,
                threadId: matchRequest.ThreadId ?? "",
                rejectedAt: DateTime.UtcNow
            );

            await _publishEndpoint.Publish(integrationEvent, cancellationToken);
            Logger.LogInformation("Published MatchRequestRejectedIntegrationEvent for Request: {RequestId}", matchRequest.Id);

            return Success(true, "Match request rejected successfully");
        }
    }
}