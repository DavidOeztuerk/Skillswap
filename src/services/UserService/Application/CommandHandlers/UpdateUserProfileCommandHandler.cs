using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Commands;
using EventSourcing;
using Events.Domain.User;
using Contracts.User.Responses;

namespace UserService.Application.CommandHandlers;

public class UpdateUserProfileCommandHandler(
    UserDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<UpdateUserProfileCommandHandler> logger)
    : BaseCommandHandler<UpdateUserProfileCommand, UpdateUserProfileResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<UpdateUserProfileResponse>> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found");
            }

            user.FirstName = request.FirstName ?? "";
            user.LastName = request.LastName ?? "";
            user.UserName = request.UserName ?? "";
            user.PhoneNumber = request.PhoneNumber ?? "";
            user.Bio = request.Bio;
            user.TimeZone = request.TimeZone;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event

            await _eventPublisher.Publish(new UserProfileUpdatedDomainEvent(
                user.Id,
                user.Email,
                new Dictionary<string, string>
                {
                    { "FirstName", user.FirstName },
                    { "LastName", user.LastName },
                    { "UserName", user.UserName ?? "" },
                    { "PhoneNumber", user.PhoneNumber ?? "" },
                    { "Bio", user.Bio ?? "" },
                    { "TimeZone", user.TimeZone ?? "" }
                }), cancellationToken);

            Logger.LogInformation("User profile updated for user {UserId}", request.UserId);


            var response = new UpdateUserProfileResponse(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.UserName,
                user.PhoneNumber,
                user.Bio,
                user.TimeZone,
                user.UpdatedAt.Value);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating user profile for {UserId}", request.UserId);
            return Error("An error occurred while updating user profile. Please try again.");
        }
    }
}
