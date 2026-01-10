using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using EventSourcing;
using Events.Domain.Matchmaking;
using CQRS.Models;
using Contracts.Matchmaking.Responses;
using Core.Common.Exceptions;
using Infrastructure.Caching;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.CommandHandlers;

public class CompleteMatchCommandHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IDistributedCacheService cacheService,
    ILogger<CompleteMatchCommandHandler> logger)
    : BaseCommandHandler<CompleteMatchCommand, CompleteMatchResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IDistributedCacheService _cacheService = cacheService;

    public override async Task<ApiResponse<CompleteMatchResponse>> Handle(
        CompleteMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await _unitOfWork.Matches.Query
            .Include(m => m.AcceptedMatchRequest)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

        if (match == null)
        {
            return Error("Match not found", ErrorCodes.ResourceNotFound);
        }

        if (match.OfferingUserId != request.UserId && match.RequestingUserId != request.UserId)
        {
            return Error("You are not authorized to complete this match", ErrorCodes.InsufficientPermissions);
        }

        if (match.Status != MatchStatus.Accepted)
        {
            return Error($"Cannot complete match in {match.Status} status", ErrorCodes.InvalidOperation);
        }

        if (request.Rating.HasValue)
        {
            if (match.OfferingUserId == request.UserId)
            {
                match.RateByOffering(request.Rating.Value);
            }
            else
            {
                match.RateByRequesting(request.Rating.Value);
            }
        }

        match.Complete(request.CompletionNotes);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // INVALIDATE CACHE for both users - match status changed to completed
        try
        {
            // Invalidate matches cache for both users
            await _cacheService.RemoveByPatternAsync(
                $"matches:user:{match.OfferingUserId}:*",
                cancellationToken);

            await _cacheService.RemoveByPatternAsync(
                $"matches:user:{match.RequestingUserId}:*",
                cancellationToken);

            Logger.LogInformation(
                "Invalidated matches cache for users {OfferingUserId} and {RequestingUserId}",
                match.OfferingUserId, match.RequestingUserId);
        }
        catch (Exception ex)
        {
            // Cache invalidation failure should not break the flow
            Logger.LogWarning(ex,
                "Failed to invalidate matches cache for users {OfferingUserId} and {RequestingUserId}. Cache will expire naturally.",
                match.OfferingUserId, match.RequestingUserId);
        }

        await _eventPublisher.Publish(new MatchCompletedDomainEvent(
            match.Id,
            match.OfferingUserId,
            match.RequestingUserId,
            match.AcceptedMatchRequest.SessionDurationMinutes ?? 60,
            match.CompletedAt!.Value), cancellationToken);

        return Success(new CompleteMatchResponse(
            match.Id,
            match.Status == MatchStatus.Completed,
            match.CompletedAt!.Value));
    }
}