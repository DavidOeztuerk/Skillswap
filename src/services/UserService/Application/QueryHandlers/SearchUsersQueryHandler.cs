using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.QueryHandlers;

// ============================================================================
// SEARCH USERS QUERY HANDLER
// ============================================================================

public class SearchUsersQueryHandler(
    UserDbContext dbContext,
    ILogger<SearchUsersQueryHandler> logger)
    : BasePagedQueryHandler<SearchUsersQuery, UserSearchResultResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<PagedResponse<UserSearchResultResponse>> Handle(
        SearchUsersQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
                .Where(u => !u.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(u =>
                    u.FirstName.Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase) ||
                    u.LastName.Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase) ||
                    u.Email.Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase));
            }

            if (!string.IsNullOrEmpty(request.Role))
            {
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role == request.Role && ur.IsActive));
            }

            if (!string.IsNullOrEmpty(request.AccountStatus.ToString()))
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

            // Get total count
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply paging and sorting
            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(u => new UserSearchResultResponse(
                    u.Id,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.UserRoles.Where(ur => ur.IsActive).Select(ur => ur.Role).ToList(),
                    u.EmailVerified,
                    u.AccountStatus,
                    u.CreatedAt,
                    u.LastLoginAt))
                .ToListAsync(cancellationToken);

            Logger.LogInformation("Searched users with term '{SearchTerm}', found {Count} results",
                request.SearchTerm, totalCount);

            return Success(users, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error searching users");
            return Error("An error occurred while searching users");
        }
    }
}