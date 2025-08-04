using CQRS.Handlers;
using UserService.Application.Commands;
using UserService.Domain.Repositories;
using Contracts.User.Responses.Auth;
using Microsoft.Extensions.Logging;
using CQRS.Models;

namespace UserService.Application.CommandHandlers;

public class LoginUserCommandHandler(
    IAuthRepository authRepository,
    ILogger<LoginUserCommandHandler> logger)
    : BaseCommandHandler<LoginUserCommand, LoginResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;

    public override async Task<ApiResponse<LoginResponse>> Handle(
        LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authRepository.LoginUser(
                request.Email,
                request.Password,
                request.TwoFactorCode,
                request.DeviceId,
                request.DeviceInfo,
                cancellationToken);

            Logger.LogInformation("User {Email} logged in successfully", request.Email);
            return Success(result, "Login successful");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error during login for email {Email}", request.Email);
            return Error("An error occurred during login. Please try again.");
        }
    }
}
