using UserService.Application.Queries;
using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Domain.Repositories;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using CQRS.Models;

namespace UserService.Application.QueryHandlers;

public class CheckEmailAvailabilityQueryHandler(
    IUserRepository userRepository,
    ILogger<CheckEmailAvailabilityQueryHandler> logger)
    : BaseQueryHandler<CheckEmailAvailabilityQuery, EmailAvailabilityResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<ApiResponse<EmailAvailabilityResponse>> Handle(
        CheckEmailAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var exists = await _userRepository.IsEmailTaken(request.Email, cancellationToken);

            string? suggestion = null;
            if (exists)
            {
                // Generate a suggestion by adding numbers
                var baseEmail = request.Email.Split('@')[0];
                var domain = request.Email.Split('@')[1];

                for (int i = 1; i <= 10; i++)
                {
                    var suggestedEmail = $"{baseEmail}{i}@{domain}";
                    var suggestionExists = await _userRepository.IsEmailTaken(suggestedEmail, cancellationToken);

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