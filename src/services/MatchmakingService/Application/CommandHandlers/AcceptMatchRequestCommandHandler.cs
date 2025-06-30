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
    ILogger<RejectMatchCommandHandler> logger)
    : BaseCommandHandler<AcceptMatchRequestCommand, AcceptDirectMatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<AcceptDirectMatchRequestResponse>> Handle(
        AcceptMatchRequestCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.UserId) ||
            string.IsNullOrWhiteSpace(request.RequestId))
            {
                return Error("Missing required fields");
            }

            // Optionally: Check if requester and target exist, or if a similar match already exists

            var matchRequest = await _dbContext.MatchRequests.FirstOrDefaultAsync(x => x.Id == request.RequestId, cancellationToken);
            matchRequest?.Accept();

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Optionally: Publish domain event
            // await _eventPublisher.Publish(new MatchRequestCreatedDomainEvent(matchRequest.Id, ...), cancellationToken);

            var match = new Match
            {
                RequestedSkillId = matchRequest?.SkillId ?? "",
            };

            match.Accept();

            await _dbContext.Matches.AddAsync(match, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var response = new AcceptDirectMatchRequestResponse(
                match.Id,
                match.Status,
                match.AcceptedAt!.Value);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating match request for UserId {UserId}", request.UserId);
            return Error("An error occurred while creating the match request");
        }
    }
}
