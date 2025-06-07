using Microsoft.EntityFrameworkCore;
using UserService.Application.Queries;
using System.Text.Json;
using CQRS.Handlers;
using Infrastructure.Models;
namespace UserService.Application.QueryHandlers;

// ============================================================================
// CHECK EMAIL AVAILABILITY QUERY HANDLER
// ============================================================================

public class CheckEmailAvailabilityQueryHandler(
    UserDbContext dbContext,
    ILogger<CheckEmailAvailabilityQueryHandler> logger)
    : BaseQueryHandler<CheckEmailAvailabilityQuery, EmailAvailabilityResponse>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<EmailAvailabilityResponse>> Handle(
        CheckEmailAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var exists = await _dbContext.Users
                .AnyAsync(u => u.Email == request.Email && !u.IsDeleted, cancellationToken);

            string? suggestion = null;
            if (exists)
            {
                // Generate a suggestion by adding numbers
                var baseEmail = request.Email.Split('@')[0];
                var domain = request.Email.Split('@')[1];

                for (int i = 1; i <= 10; i++)
                {
                    var suggestedEmail = $"{baseEmail}{i}@{domain}";
                    var suggestionExists = await _dbContext.Users
                        .AnyAsync(u => u.Email == suggestedEmail && !u.IsDeleted, cancellationToken);

                    if (!suggestionExists)
                    {
                        suggestion = suggestedEmail;
                        break;
                    }
                }
            }

            var response = new EmailAvailabilityResponse(
                request.Email,
                !exists,
                suggestion);

            Logger.LogInformation("Checked email availability for {Email}: {IsAvailable}",
                request.Email, !exists);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error checking email availability for {Email}", request.Email);
            return Error("An error occurred while checking email availability");
        }
    }
}