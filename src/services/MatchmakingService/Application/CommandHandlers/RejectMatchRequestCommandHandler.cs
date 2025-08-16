using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Infrastructure.HttpClients;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using Events.Integration.Matchmaking;

namespace MatchmakingService.Application.CommandHandlers;

public class RejectMatchRequestCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<RejectMatchRequestCommandHandler> logger)
    : BaseCommandHandler<RejectMatchRequestCommand, bool>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<ApiResponse<bool>> Handle(
        RejectMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var matchRequest = await _dbContext.MatchRequests
                .FirstOrDefaultAsync(mr => mr.Id == request.RequestId, cancellationToken);

            if (matchRequest == null)
            {
                return Error("Match request not found");
            }

            if (matchRequest.Status != "Pending")
            {
                return Error("Match request is no longer pending");
            }

            // Reject the request
            matchRequest.Reject(request.ResponseMessage);

            await _dbContext.SaveChangesAsync(cancellationToken);

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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error rejecting match request {RequestId}", request.RequestId);
            return Error("An error occurred while rejecting the match request");
        }
    }
}