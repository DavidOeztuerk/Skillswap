using CQRS.Handlers;
using UserService.Application.Queries;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.QueryHandlers;

public class GetAllUsersQueryHandler(
    IUserRepository userRepository,
    ILogger<GetAllUsersQueryHandler> logger)
    : BasePagedQueryHandler<GetAllUsersQuery, UserAdminResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<PagedResponse<UserAdminResponse>> Handle(
        GetAllUsersQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Starting to retrieve users with query: {@Query}", request);

        try
        {
            // Get paginated users from repository
            var (users, totalCount) = await _userRepository.GetAllUsersPagedAsync(
                request.PageNumber, request.PageSize, cancellationToken);

            // Transform to response objects
            var userResponses = new List<UserAdminResponse>();
            foreach (var user in users)
            {
                var userRoles = await _userRepository.GetActiveUserRoles(user.Id, cancellationToken);
                
                userResponses.Add(new UserAdminResponse(
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.UserName,
                    userRoles.Select(ur => ur.Role).ToList(),
                    user.EmailVerified,
                    user.AccountStatus.ToString(),
                    user.CreatedAt,
                    user.LastLoginAt,
                    user.LastLoginIp,
                    user.FailedLoginAttempts,
                    user.IsAccountLocked,
                    user.AccountLockedUntil));
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            Logger.LogInformation("Retrieved {Count} users (page {Page} of {TotalPages})",
                userResponses.Count, request.PageNumber, totalPages);

            return Success(userResponses, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving users");
            return Error("An error occurred while retrieving users");
        }
    }
}