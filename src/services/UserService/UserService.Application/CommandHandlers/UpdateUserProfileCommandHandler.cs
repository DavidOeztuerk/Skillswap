using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using EventSourcing;
using Events.Domain.User;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class UpdateUserProfileCommandHandler(
    IUserProfileRepository userProfileRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<UpdateUserProfileCommandHandler> logger)
    : BaseCommandHandler<UpdateUserProfileCommand, UpdateUserProfileResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<UpdateUserProfileResponse>> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

        try
        {
            var user = await _userProfileRepository.UpdateUserProfile(
                request.UserId,
                request.FirstName ?? "",
                request.LastName ?? "",
                request.UserName ?? "",
                request.Bio,
                cancellationToken);

            // Publish domain event

            await _eventPublisher.Publish(new UserProfileUpdatedDomainEvent(
                user.Id,
                user.Email,
                new Dictionary<string, string>
                {
                    { "FirstName", user.FirstName },
                    { "LastName", user.LastName },
                    { "UserName", user.UserName ?? "" },
                    { "Bio", user.Bio ?? "" }
                }), cancellationToken);

            Logger.LogInformation("User profile updated for user {UserId}", request.UserId);

            var response = new UpdateUserProfileResponse(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.UserName,
                user.PhoneNumber ?? "",
                user.Bio,
                user.TimeZone ?? "",
                user.UpdatedAt);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating user profile for {UserId}", request.UserId);
            return Error("An error occurred while updating user profile. Please try again.", ErrorCodes.InternalError);
        }
    }
}
