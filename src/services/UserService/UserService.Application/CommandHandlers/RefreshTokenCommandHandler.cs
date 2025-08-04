using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Infrastructure.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers;

public class RefreshTokenCommandHandler(
    IAuthRepository authRepository,
    ILogger<RefreshTokenCommandHandler> logger)
    : BaseCommandHandler<RefreshTokenCommand, RefreshTokenResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;

    public override async Task<ApiResponse<RefreshTokenResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authRepository.RefreshUserToken(
                request.AccessToken,
                request.RefreshToken,
                cancellationToken);

            Logger.LogInformation("Tokens refreshed successfully");
            return Success(result, "Tokens refreshed successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error refreshing tokens");
            return Error("An error occurred while refreshing tokens. Please login again.");
        }
    }
}
