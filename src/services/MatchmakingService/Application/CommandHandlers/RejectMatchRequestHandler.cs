using CQRS.Handlers;
using EventSourcing;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.CommandHandlers;

public class RejectMatchRequestHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<RejectMatchRequestHandler> logger)
    : BaseCommandHandler<RejectMatchRequestCommand, bool>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

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

            return Success(true);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error rejecting match request {RequestId}", request.RequestId);
            return Error("An error occurred while rejecting the match request");
        }
    }
}