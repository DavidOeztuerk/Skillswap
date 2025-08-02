using CQRS.Handlers;
using EventSourcing;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.CommandHandlers;

public class AcceptMatchRequestHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<AcceptMatchRequestHandler> logger)
    : BaseCommandHandler<AcceptMatchRequestCommand, bool>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<bool>> Handle(
        AcceptMatchRequestCommand request,
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

            // Accept the request
            matchRequest.Accept(request.ResponseMessage);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return Success(true);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error accepting match request {RequestId}", request.RequestId);
            return Error("An error occurred while accepting the match request");
        }
    }
}