using CQRS.Handlers;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using EventSourcing;
using Events.Domain.Matchmaking;
using CQRS.Models;
using MassTransit;
using Events.Integration.Matchmaking;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.CommandHandlers;

public class DissolveMatchCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    ILogger<DissolveMatchCommandHandler> logger)
    : BaseCommandHandler<DissolveMatchCommand, DissolveMatchResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<DissolveMatchResponse>> Handle(
        DissolveMatchCommand request,
        CancellationToken cancellationToken)
    {
        {
            var match = await _unitOfWork.Matches.Query
                .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

            if (match == null)
            {
                return Error("Match not found", ErrorCodes.ResourceNotFound);
            }

            // Check authorization - both users can dissolve the match
            if (match.OfferingUserId != request.UserId && match.RequestingUserId != request.UserId)
            {
                return Error("You are not authorized to dissolve this match", ErrorCodes.InsufficientPermissions);
            }

            // Only active matches can be dissolved
            if (!match.IsActive)
            {
                return Error($"Cannot dissolve match in {match.Status} status", ErrorCodes.InvalidOperation);
            }

            // Dissolve the match
            match.Dissolve(request.Reason);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new MatchDissolvedDomainEvent(
                match.Id,
                match.OfferingUserId,
                match.RequestingUserId,
                request.Reason,
                match.DissolvedAt!.Value), cancellationToken);

            // Publish integration event to cancel all future appointments
            await _publishEndpoint.Publish(new MatchDissolvedIntegrationEvent(
                match.Id,
                match.OfferingUserId,
                match.RequestingUserId,
                request.Reason), cancellationToken);

            Logger.LogInformation("Match {MatchId} dissolved by user {UserId} with reason: {Reason}",
                request.MatchId, request.UserId, request.Reason);

            return Success(new DissolveMatchResponse(
                match.Id,
                match.Status.ToString(),
                match.DissolvedAt!.Value));
        }
    }
}