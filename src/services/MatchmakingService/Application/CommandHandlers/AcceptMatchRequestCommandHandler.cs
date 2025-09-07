using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Infrastructure.HttpClients;
using Microsoft.EntityFrameworkCore;
using Events.Domain.Matchmaking;
using MassTransit;
using Events.Integration.Matchmaking;
using Core.Common.Exceptions;

namespace MatchmakingService.Application.CommandHandlers;

public class AcceptMatchRequestCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<AcceptMatchRequestCommandHandler> logger)
    : BaseCommandHandler<AcceptMatchRequestCommand, bool>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<ApiResponse<bool>> Handle(
        AcceptMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        {
            var matchRequest = await _dbContext.MatchRequests
                .FirstOrDefaultAsync(mr => mr.Id == request.RequestId, cancellationToken);

            if (matchRequest == null)
            {
                return Error("Match request not found", ErrorCodes.ResourceNotFound);
            }

            if (matchRequest.Status != "Pending")
            {
                return Error("Match request is no longer pending", ErrorCodes.InvalidOperation);
            }

            // Accept the request
            matchRequest.Accept(request.ResponseMessage);

            // Create a Match entity from the accepted request
            var match = new Match
            {
                Id = Guid.NewGuid().ToString(),
                OfferedSkillId = matchRequest.SkillId,
                RequestedSkillId = matchRequest.ExchangeSkillId ?? matchRequest.SkillId,
                OfferingUserId = matchRequest.TargetUserId,
                RequestingUserId = matchRequest.RequesterId,
                OfferedSkillName = "Skill", // TODO: Get from SkillService
                RequestedSkillName = "Skill", // TODO: Get from SkillService
                Status = MatchStatus.Accepted,
                CompatibilityScore = 0.85, // TODO: Calculate real score
                MatchReason = "Match Request Accepted",
                
                // Copy exchange details
                IsSkillExchange = matchRequest.IsSkillExchange,
                ExchangeSkillId = matchRequest.ExchangeSkillId,
                ExchangeSkillName = matchRequest.ExchangeSkillId != null ? "Exchange Skill" : null,
                
                // Copy monetary details
                IsMonetary = matchRequest.IsMonetaryOffer,
                AgreedAmount = matchRequest.OfferedAmount,
                Currency = matchRequest.Currency,
                
                // Copy session details
                AgreedDays = matchRequest.PreferredDays ?? new List<string>(),
                AgreedTimes = matchRequest.PreferredTimes ?? new List<string>(),
                TotalSessionsPlanned = matchRequest.TotalSessions ?? 1,
                CompletedSessions = 0,
                
                // Thread tracking
                OriginalRequestId = matchRequest.Id,
                ThreadId = matchRequest.ThreadId,
                
                AcceptedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Matches.Add(match);
            await _dbContext.SaveChangesAsync(cancellationToken);

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
                totalSessions: matchRequest.TotalSessions ?? 1,
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