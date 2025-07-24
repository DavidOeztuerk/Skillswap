using Contracts.User.Responses;
using UserService.Application.Commands;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using Infrastructure.Models;
using CQRS.Handlers;
using UserService.Domain.Models;
using Events.Domain.User;

namespace UserService.Application.CommandHandlers;

public class BlockUserCommandHandler(
    UserDbContext dbContext,
    IPublishEndpoint eventPublisher,
    ILogger<BlockUserCommandHandler> logger)
    : BaseCommandHandler<BlockUserCommand, BlockUserResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<BlockUserResponse>> Handle(BlockUserCommand request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Blocking user {BlockedUserId} by user {UserId}", request.BlockedUserId, request.UserId);

        // Verify both users exist
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return Error("User not found");
        }

        var blockedUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.BlockedUserId, cancellationToken);

        if (blockedUser == null)
        {
            return Error("User to block not found");
        }

        // Check if already blocked
        var existingBlock = await _dbContext.BlockedUsers
            .FirstOrDefaultAsync(b => b.UserId == request.UserId && b.Id == request.BlockedUserId, cancellationToken);

        if (existingBlock != null)
        {
            return Error("User is already blocked");
        }

        // Create block relationship
        var blockRelationship = new BlockedUser
        {
            Id = request.BlockedUserId,
            UserId = request.UserId,
            Reason = request.Reason,
            BlockedAt = DateTime.UtcNow
        };

        _dbContext.BlockedUsers.Add(blockRelationship);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish domain event
        await _eventPublisher.Publish(new UserBlockedEvent(
            request.UserId,
            request.BlockedUserId,
            request.Reason,
            DateTime.UtcNow), cancellationToken);

        Logger.LogInformation("Successfully blocked user {BlockedUserId} by user {UserId}", request.BlockedUserId, request.UserId);

        return Success(new BlockUserResponse(
            request.UserId,
            request.BlockedUserId,
            blockRelationship.BlockedAt,
            blockRelationship.Reason ?? string.Empty
        ));
    }
}