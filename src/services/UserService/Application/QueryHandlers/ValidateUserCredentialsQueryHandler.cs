using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using System.Text.Json;
using CQRS.Handlers;
using Infrastructure.Models;
namespace UserService.Application.QueryHandlers;

// ============================================================================
// VALIDATE USER CREDENTIALS QUERY HANDLER
// ============================================================================

public class ValidateUserCredentialsQueryHandler(
    UserDbContext dbContext,
    ILogger<ValidateUserCredentialsQueryHandler> logger) 
    : BaseQueryHandler<ValidateUserCredentialsQuery, UserValidationResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<UserValidationResponse>> Handle(
        ValidateUserCredentialsQuery request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted, cancellationToken);

            if (user == null)
            {
                var response = new UserValidationResponse(
                    false, null, "User not found", false, false, null);
                return Success(response);
            }

            // Check if account is locked
            if (user.IsAccountLocked)
            {
                var response = new UserValidationResponse(
                    false, user.Id, "Account is locked", false, true, user.AccountLockedUntil);
                return Success(response);
            }

            // Validate password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                // Increment failed attempts
                user.FailedLoginAttempts++;
                
                // Lock account after 5 failed attempts
                if (user.FailedLoginAttempts >= 5)
                {
                    user.LockAccount(TimeSpan.FromMinutes(30), "Too many failed login attempts");
                }
                
                await _dbContext.SaveChangesAsync(cancellationToken);

                var response = new UserValidationResponse(
                    false, user.Id, "Invalid password", false, user.IsAccountLocked, user.AccountLockedUntil);
                return Success(response);
            }

            // Reset failed attempts on successful validation
            if (user.FailedLoginAttempts > 0)
            {
                user.FailedLoginAttempts = 0;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            var validResponse = new UserValidationResponse(
                true, 
                user.Id, 
                "Valid credentials", 
                !user.EmailVerified, 
                false, 
                null);

            return Success(validResponse);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error validating credentials for email {Email}", request.Email);
            return Error("An error occurred while validating credentials");
        }
    }
}
