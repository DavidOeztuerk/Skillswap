using UserService.Application.Queries;
using System.Text.Json;
using CQRS.Handlers;
using Contracts.User.Responses;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using Core.Common.Exceptions;

namespace UserService.Application.QueryHandlers;

public class GetUserProfileQueryHandler(
    IUserProfileRepository userProfileRepository,
    ILogger<GetUserProfileQueryHandler> logger)
    : BaseQueryHandler<GetUserProfileQuery, UserProfileResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;

    public override async Task<ApiResponse<UserProfileResponse>> Handle(
        GetUserProfileQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Retrieve user from db with claims {UserId}", request.UserId);

        var user = await _userProfileRepository.GetUserProfile(request.UserId, cancellationToken);
        if (user == null)
            throw new ResourceNotFoundException("User", request.UserId);

        var preferences = string.IsNullOrWhiteSpace(user.PreferencesJson)
            ? new Dictionary<string, string>()
            : (JsonSerializer.Deserialize<Dictionary<string, string>>(user.PreferencesJson)
                ?? new Dictionary<string, string>());

        var activeRoles = user.UserRoles
            .Where(ur => ur.IsActive && ur.Role != null)
            .Select(ur => ur.Role.Name)
            .ToList();

        var response = new UserProfileResponse(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.UserName,
            user.PhoneNumber,
            user.Bio,
            user.TimeZone,
            activeRoles,
            user.EmailVerified,
            user.AccountStatus.ToString(),
            user.CreatedAt,
            user.LastLoginAt,
            preferences,
            user.ProfilePictureUrl);

        Logger.LogInformation("Retrieved profile for user {UserId}", request.UserId);
        return Success(response);
    }
}
