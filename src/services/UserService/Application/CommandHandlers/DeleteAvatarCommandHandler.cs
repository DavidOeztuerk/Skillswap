using Contracts.User.Responses;
using UserService.Application.Commands;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.CommandHandlers;

public class DeleteAvatarCommandHandler(
    UserDbContext dbContext,
    IPublishEndpoint eventPublisher,
    ILogger<DeleteAvatarCommandHandler> logger)
    : BaseCommandHandler<DeleteAvatarCommand, DeleteAvatarResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IPublishEndpoint _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<DeleteAvatarResponse>> Handle(DeleteAvatarCommand request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Deleting avatar for user {UserId}", request.UserId);

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return Error("User not found");
        }

        if (string.IsNullOrEmpty(user.ProfilcePictureUrl))
        {
            return Error("User has no avatar to delete");
        }

        var oldAvatarUrl = user.ProfilcePictureUrl;

        // Clear avatar URL
        user.ProfilcePictureUrl = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish domain event
        // await _eventPublisher.Publish(new UserAvatarDeletedEvent
        // {
        //     UserId = request.UserId,
        //     PreviousAvatarUrl = oldAvatarUrl,
        //     Timestamp = DateTime.UtcNow
        // }, cancellationToken);

        Logger.LogInformation("Successfully deleted avatar for user {UserId}", request.UserId);

        return Success(new DeleteAvatarResponse(
            request.UserId ?? string.Empty,
            true,
            "Avatar deleted successfully"
        ));
    }
}