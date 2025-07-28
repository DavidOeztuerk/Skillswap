using CQRS.Handlers;
using EventSourcing;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.CommandHandlers;

public class AcceptMatchRequestCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<AcceptMatchRequestCommandHandler> logger)
    : BaseCommandHandler<AcceptMatchRequestCommand, MatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<MatchRequestResponse>> Handle(
        AcceptMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Find the match request
            var matchRequest = await _dbContext.MatchRequests
                .FirstOrDefaultAsync(mr => mr.Id == request.RequestId, cancellationToken);

            if (matchRequest == null)
            {
                return Error("Match request not found");
            }

            // In the MatchRequest system, anyone can respond to general requests
            // No target user verification needed

            // Check if already processed
            if (!matchRequest.IsPending)
            {
                return Error($"Match request has already been {matchRequest.Status.ToLower()}");
            }

            // Accept the request
            matchRequest.Accept(request.ResponseMessage);

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Optionally: Publish domain event for notifications
            // await _eventPublisher.Publish(new MatchRequestAcceptedDomainEvent(matchRequest.Id, ...), cancellationToken);

            var response = new MatchRequestResponse(
                RequestId: matchRequest.Id,
                RequesterId: matchRequest.RequesterId,
                TargetUserId: string.Empty, // No target user in MatchRequest system
                SkillId: matchRequest.SkillId,
                Description: matchRequest.Description ?? string.Empty,
                Message: matchRequest.Message,
                Status: matchRequest.Status,
                CreatedAt: matchRequest.CreatedAt,
                RespondedAt: matchRequest.RespondedAt,
                ExpiresAt: matchRequest.ExpiresAt);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error accepting match request {RequestId}", request.RequestId);
            return Error("An error occurred while accepting the match request");
        }
    }
}
