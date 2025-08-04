using Contracts.User.Responses;
using UserService.Application.Commands;
using MassTransit;
using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

public class DeleteAvatarCommandHandler(
    IUserProfileRepository userProfileRepository,
    IPublishEndpoint eventPublisher,
    ILogger<DeleteAvatarCommandHandler> logger)
    : BaseCommandHandler<DeleteAvatarCommand, DeleteAvatarResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<DeleteAvatarResponse>> Handle(DeleteAvatarCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required");

        Logger.LogInformation("Deleting avatar for user {UserId}", request.UserId);

        await _userProfileRepository.DeleteAvatar(request.UserId, cancellationToken);

        Logger.LogInformation("Successfully deleted avatar for user {UserId}", request.UserId);

        return Success(new DeleteAvatarResponse(
            request.UserId ?? string.Empty,
            true,
            "Avatar deleted successfully"
        ));
    }
}