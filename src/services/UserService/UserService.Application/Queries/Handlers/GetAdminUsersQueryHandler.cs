using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.Queries.Handlers;

public class GetAdminUsersQueryHandler(
    IUserRepository context,
    ILogger<GetAdminUsersQueryHandler> logger)
    : BasePagedQueryHandler<GetAdminUsersQuery, AdminUserResponse>(logger)
{
    private readonly IUserRepository _context = context;

    public override async Task<PagedResponse<AdminUserResponse>> Handle(
        GetAdminUsersQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Getting admin users list");

            var query = _context.GetUsers(cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var status = request.Status.ToLowerInvariant();
                query = status switch
                {
                    "active" => query.Where(u => !u.IsSuspended),
                    "suspended" => query.Where(u => u.IsSuspended),
                    "verified" => query.Where(u => u.EmailVerified),
                    "unverified" => query.Where(u => !u.EmailVerified),
                    _ => query
                };
            }

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                var rn = request.Role;
                query = query.Where(u => u.UserRoles.Any(x => x.RevokedAt == null && x.Role.Name.Contains(rn)));
            }

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var s = request.Search.ToLowerInvariant();
                query = query.Where(u =>
                    u.UserName.ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s) ||
                    (u.FirstName != null && u.FirstName.ToLower().Contains(s)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(s)));
            }

            var totalRecords = await query.CountAsync(cancellationToken);

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(u => new AdminUserResponse
                {
                    Id = u.Id,
                    Username = u.UserName,
                    Email = u.Email,
                    Roles = u.UserRoles
                        .Where(x => x.RevokedAt == null)
                        .Select(x => x.Role.Name)
                        .ToList(),
                    AccountStatus = u.IsSuspended ? "suspended" : "active",
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt,
                    EmailVerified = u.EmailVerified,
                    TwoFactorEnabled = u.TwoFactorEnabled
                })
                .ToListAsync(cancellationToken);

            return Success(users, request.PageNumber, request.PageSize, totalRecords, "Users retrieved successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting admin users list");
            return Error("Failed to retrieve users", ErrorCodes.InternalError);
        }
    }
}
