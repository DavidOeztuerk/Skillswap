using CQRS.Handlers;
using CQRS.Models;
using EventSourcing;
using MatchmakingService.Application.Commands;
using Microsoft.EntityFrameworkCore;
using Core.Common.Exceptions;

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

            await _dbContext.SaveChangesAsync(cancellationToken);

            return Success(true);
        }
    }
}