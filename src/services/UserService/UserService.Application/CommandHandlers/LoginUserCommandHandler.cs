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
        // Let exceptions bubble up to GlobalExceptionHandler
        // Only catch specific exceptions that we want to handle differently
        
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
}
