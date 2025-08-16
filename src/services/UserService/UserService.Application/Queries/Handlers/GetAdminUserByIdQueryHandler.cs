using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.Queries.Handlers;

public class GetAdminUserByIdQueryHandler(
    IUserRepository users,
    ILogger<GetAdminUserByIdQueryHandler> logger)
    : BaseQueryHandler<GetAdminUserByIdQuery, AdminUserResponse>(logger)
{
    private readonly IUserRepository _users = users;

    public override async Task<ApiResponse<AdminUserResponse>> Handle(GetAdminUserByIdQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
            return Error("UserId is required");

        try
        {
            var user = await _users.GetUserWithRoles(request.UserId, ct);
            if (user is null)
                return Error("User not found");

            var roles = user.UserRoles
                .Where(ur => ur.RevokedAt == null)
                .Select(ur => ur.Role.Name)
                .Distinct()
                .ToList();

            var response = new AdminUserResponse
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                Roles = roles,
                AccountStatus = user.AccountStatus.ToString(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                EmailVerified = user.EmailVerified,
                TwoFactorEnabled = user.TwoFactorEnabled
            };

            return Success(response, "User retrieved successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting admin user {UserId}", request.UserId);
            return Error("Failed to retrieve user");
        }
    }
}
