using Microsoft.Extensions.Logging;
using CQRS.Models;
using CQRS.Handlers;
using UserService.Domain.Repositories;

namespace UserService.Application.Queries.Handlers;

public class GetEmailVerificationStatusQueryHandler(
    IUserRepository userRepository,
    ILogger<GetEmailVerificationStatusQueryHandler> logger)
    : BaseQueryHandler<GetEmailVerificationStatusQuery, EmailVerificationStatusResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<ApiResponse<EmailVerificationStatusResponse>> Handle(
        GetEmailVerificationStatusQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _userRepository.GetUserById(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found");
            }

            var response = new EmailVerificationStatusResponse
            {
                EmailVerified = user.EmailVerified,
                CooldownUntil = user.EmailVerificationCooldownUntil,
                ExpiresAt = user.EmailVerificationTokenExpiresAt,
                SentAt = user.EmailVerificationSentAt,
                AttemptsCount = user.EmailVerificationAttempts
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting email verification status for user {UserId}", request.UserId);
            return Error("An error occurred while getting verification status");
        }
    }
}