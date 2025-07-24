using CQRS.Interfaces;
using Contracts.User.Responses;
using UserService.Application.Commands;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.CommandHandlers;

public class UnblockUserCommandHandler(
    UserDbContext dbContext,
    IPublishEndpoint eventPublisher,
    ILogger<UnblockUserCommandHandler> logger)
    : BaseCommandHandler<UnblockUserCommand, UnblockUserResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<UnblockUserResponse>> Handle(UnblockUserCommand request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Unblocking user {BlockedUserId} by user {UserId}", request.BlockedUserId, request.UserId);

        // Find the block relationship
        var blockRelationship = await _dbContext.BlockedUsers
            .FirstOrDefaultAsync(b => b.UserId == request.UserId && b.UserId == request.BlockedUserId, cancellationToken);

        if (blockRelationship == null)
        {
            return Error("User is not blocked");
        }

        // Remove the block
        _dbContext.BlockedUsers.Remove(blockRelationship);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish domain event
        // await _eventPublisher.Publish(new UserUnblockedEvent
        // {
        //     UserId = request.UserId,
        //     UnblockedUserId = request.BlockedUserId,
        //     Timestamp = DateTime.UtcNow
        // }, cancellationToken);

        Logger.LogInformation("Successfully unblocked user {BlockedUserId} by user {UserId}", request.BlockedUserId, request.UserId);

        return Success(new UnblockUserResponse(
            request.UserId,
            request.BlockedUserId,
            DateTime.UtcNow,
            ""
        ));
    }
}