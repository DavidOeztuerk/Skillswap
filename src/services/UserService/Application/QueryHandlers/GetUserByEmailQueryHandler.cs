using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using CQRS.Handlers;
using Infrastructure.Models;

namespace UserService.Application.QueryHandlers;

// ============================================================================
// GET USER BY EMAIL QUERY HANDLER
// ============================================================================

public class GetUserByEmailQueryHandler(
    UserDbContext dbContext,
    ILogger<GetUserByEmailQueryHandler> logger) 
    : BaseQueryHandler<GetUserByEmailQuery, UserSummaryResponse?>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<UserSummaryResponse?>> Handle(
        GetUserByEmailQuery request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
                .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted, cancellationToken);

            if (user == null)
            {
                return Success(null);
            }

            var response = new UserSummaryResponse(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.UserRoles.Select(ur => ur.Role).ToList(),
                user.EmailVerified,
                user.AccountStatus);

            Logger.LogInformation("Retrieved user by email {Email}", request.Email);
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving user by email {Email}", request.Email);
            return Error("An error occurred while retrieving user");
        }
    }
}