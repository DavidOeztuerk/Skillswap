using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using System.Text.Json;
using CQRS.Handlers;
using Infrastructure.Models;
using Contracts.User.Responses;

namespace UserService.Application.QueryHandlers;

public class GetUserProfileQueryHandler(
    UserDbContext dbContext,
    ILogger<GetUserProfileQueryHandler> logger)
    : BaseQueryHandler<GetUserProfileQuery, UserProfileResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<UserProfileResponse>> Handle(
        GetUserProfileQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Option 1: Include alle UserRoles und später filtern
            var user = await _dbContext.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, cancellationToken);

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
                user.AccountStatus,
                user.CreatedAt,
                user.LastLoginAt,
                preferences);

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
