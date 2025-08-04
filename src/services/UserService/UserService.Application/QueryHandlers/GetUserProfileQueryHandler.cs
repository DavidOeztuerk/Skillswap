using UserService.Application.Queries;
using System.Text.Json;
using CQRS.Handlers;
using Infrastructure.Models;
using Contracts.User.Responses;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using CQRS.Models;

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
        try
        {
            var user = await _userProfileRepository.GetUserProfile(request.UserId, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            var preferences = string.IsNullOrEmpty(user.PreferencesJson)
                ? new Dictionary<string, string>()
                : JsonSerializer.Deserialize<Dictionary<string, string>>(user.PreferencesJson)
                  ?? new Dictionary<string, string>();

            // Filter aktive Rollen nach dem Laden
            var activeRoles = user.UserRoles
                .Where(ur => ur.IsActive)
                .Select(ur => ur.Role)
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
                activeRoles, // Gefilterte Rollen verwenden
                user.EmailVerified,
                user.AccountStatus.ToString(),
                user.CreatedAt,
                user.LastLoginAt,
                preferences,
                user.ProfilcePictureUrl);

            Logger.LogInformation("Retrieved profile for user {UserId}", request.UserId);
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving profile for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving user profile");
        }
    }
}
