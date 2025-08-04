using Contracts.User.Responses;
using UserService.Application.Commands;
using MassTransit;
using Infrastructure.Models;
using CQRS.Handlers;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Events.Domain.User;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

public class BlockUserCommandHandler(
    IUserBlockingRepository userBlockingRepository,
    IUserRepository userRepository,
    IPublishEndpoint eventPublisher,
    ILogger<BlockUserCommandHandler> logger)
    : BaseCommandHandler<BlockUserCommand, BlockUserResponse>(logger)
{
    private readonly IUserBlockingRepository _userBlockingRepository = userBlockingRepository;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<BlockUserResponse>> Handle(BlockUserCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required");

        Logger.LogInformation("Blocking user {BlockedUserId} by user {UserId}", request.BlockedUserId, request.UserId);

        // Verify both users exist
        var user = await _userRepository.GetUserById(request.UserId, cancellationToken);

        if (user == null)
        {
            return Error("User not found");
        }

        var blockedUser = await _userRepository.GetUserById(request.BlockedUserId, cancellationToken);

        if (blockedUser == null)
        {
            return Error("User to block not found");
        }

        // Check if already blocked
        var existingBlock = await _userBlockingRepository.GetBlockedUser(request.UserId, request.BlockedUserId, cancellationToken);

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

        await _userBlockingRepository.AddBlockedUser(blockRelationship, cancellationToken);

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