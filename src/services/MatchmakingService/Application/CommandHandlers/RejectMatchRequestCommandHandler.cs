using CQRS.Handlers;
using EventSourcing;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.CommandHandlers;

public class RejectMatchRequestCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<RejectMatchCommandHandler> logger)
    : BaseCommandHandler<RejectMatchRequestCommand, RejectMatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<RejectMatchRequestResponse>> Handle(
        RejectMatchRequestCommand request,
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
            matchRequest?.Reject();

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Optionally: Publish domain event
            // await _eventPublisher.Publish(new MatchRequestCreatedDomainEvent(matchRequest.Id, ...), cancellationToken);


            // match.Accept();

            // await _dbContext.Matches.AddAsync(match, cancellationToken);
            // await _dbContext.SaveChangesAsync(cancellationToken);

            var response = new RejectMatchRequestResponse(
                matchRequest!.Id,
                true,
                matchRequest!.UpdatedAt!.Value);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating match request for UserId {UserId}", request.UserId);
            return Error("An error occurred while creating the match request");
        }
    }
}
