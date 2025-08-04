using CQRS.Interfaces;
using Contracts.User.Responses;
using UserService.Application.Commands;
using MassTransit;
using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

public class UnblockUserCommandHandler(
    IUserBlockingRepository userBlockingRepository,
    IPublishEndpoint eventPublisher,
    ILogger<UnblockUserCommandHandler> logger)
    : BaseCommandHandler<UnblockUserCommand, UnblockUserResponse>(logger)
{
    private readonly IUserBlockingRepository _userBlockingRepository = userBlockingRepository;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<UnblockUserResponse>> Handle(UnblockUserCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required");

        Logger.LogInformation("Unblocking user {BlockedUserId} by user {UserId}", request.BlockedUserId, request.UserId);

        // Find the block relationship
        var blockRelationship = await _userBlockingRepository.GetBlockedUser(request.UserId, request.BlockedUserId, cancellationToken);

        if (blockRelationship == null)
        {
            return Error("User is not blocked");
        }

        // Remove the block
        await _userBlockingRepository.RemoveBlockedUser(blockRelationship, cancellationToken);

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