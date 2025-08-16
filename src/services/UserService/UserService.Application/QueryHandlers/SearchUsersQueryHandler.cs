using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class SearchUsersQueryHandler(
    IUserRepository userRepository,
    ILogger<SearchUsersQueryHandler> logger)
    : BasePagedQueryHandler<SearchUsersQuery, UserSearchResultResponse>(logger)
{
    private readonly IUserRepository userRepository = userRepository;

    public override async Task<PagedResponse<UserSearchResultResponse>> Handle(
        SearchUsersQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = userRepository.GetUsers(cancellationToken);

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
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == request.Role && ur.IsActive));
            }

            if (!string.IsNullOrEmpty(request.AccountStatus?.ToString()))
            {
                query = query.Where(u => u.AccountStatus.ToString() == request.AccountStatus);
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
            var totalCount = query.Count();

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
                    u.UserName,
                    u.FavoriteSkillIds, // Skills
                    u.UserRoles.Select(ur => ur.Role.Name).ToList(), // Rating - not implemented yet
                    u.EmailVerified, // ReviewCount - not implemented yet
                    u.AccountStatus.ToString(), // IsAvailable - default to true
                    u.CreatedAt,
                    u.LastLoginAt)) // JoinedAt
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
