using CQRS.Handlers;
using CQRS.Interfaces;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;

namespace UserService.Application.QueryHandlers;

// ============================================================================
// GET ALL USERS QUERY HANDLER
// ============================================================================

public class GetAllUsersQueryHandler(
    UserDbContext dbContext,
    ILogger<GetAllUsersQueryHandler> logger)
    : BasePagedQueryHandler<GetAllUsersQuery, UserSummaryResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<PagedResponse<UserSummaryResponse>>> Handle(
        GetAllUsersQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Users.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                query = query.Where(u => 
                    u.FirstName.Contains(request.SearchTerm) ||
                    u.LastName.Contains(request.SearchTerm) ||
                    u.Email.Contains(request.SearchTerm) ||
                    u.UserName.Contains(request.SearchTerm));
            }

            if (!string.IsNullOrEmpty(request.AccountStatus))
            {
                query = query.Where(u => u.AccountStatus == request.AccountStatus);
            }

            if (request.EmailVerified.HasValue)
            {
                query = query.Where(u => u.EmailVerified == request.EmailVerified.Value);
            }

            if (request.CreatedAfter.HasValue)
            {
                query = query.Where(u => u.CreatedAt >= request.CreatedAfter.Value);
            }

            if (request.CreatedBefore.HasValue)
            {
                query = query.Where(u => u.CreatedAt <= request.CreatedBefore.Value);
            }

            // Apply sorting
            query = request.SortBy?.ToLower() switch
            {
                "firstname" => request.SortDescending ? 
                    query.OrderByDescending(u => u.FirstName) : 
                    query.OrderBy(u => u.FirstName),
                "lastname" => request.SortDescending ? 
                    query.OrderByDescending(u => u.LastName) : 
                    query.OrderBy(u => u.LastName),
                "email" => request.SortDescending ? 
                    query.OrderByDescending(u => u.Email) : 
                    query.OrderBy(u => u.Email),
                "createdat" => request.SortDescending ? 
                    query.OrderByDescending(u => u.CreatedAt) : 
                    query.OrderBy(u => u.CreatedAt),
                "lastloginat" => request.SortDescending ? 
                    query.OrderByDescending(u => u.LastLoginAt) : 
                    query.OrderBy(u => u.LastLoginAt),
                _ => query.OrderBy(u => u.CreatedAt)
            };

            // Get total count
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination
            var users = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Include(u => u.UserRoles)
                .Select(u => new UserSummaryResponse(
                    u.Id,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.UserName,
                    u.UserRoles.Select(ur => ur.Role).ToList(),
                    u.EmailVerified,
                    u.AccountStatus,
                    u.CreatedAt,
                    u.LastLoginAt))
                .ToListAsync(cancellationToken);

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            var pagedResponse = new PagedResponse<UserSummaryResponse>(
                users,
                request.PageNumber,
                request.PageSize,
                totalCount,
                totalPages);

            Logger.LogInformation("Retrieved {Count} users (page {Page} of {TotalPages})", 
                users.Count, request.PageNumber, totalPages);

            return Success(pagedResponse);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving users");
            return Error<PagedResponse<UserSummaryResponse>>("An error occurred while retrieving users");
        }
    }
}