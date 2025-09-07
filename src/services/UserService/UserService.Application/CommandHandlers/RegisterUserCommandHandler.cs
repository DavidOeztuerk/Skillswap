using CQRS.Handlers;
using UserService.Application.Commands;
using CQRS.Models;
using Contracts.User.Responses.Auth;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace UserService.Application.CommandHandlers;

public class RegisterUserCommandHandler(
    IAuthRepository authRepository,
    ILogger<RegisterUserCommandHandler> logger)
    : BaseCommandHandler<RegisterUserCommand, RegisterResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;

    public override async Task<ApiResponse<RegisterResponse>> Handle(
        RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        var response = await _authRepository.RegisterUserWithTokens(
            request.Email, 
            request.Password, 
            request.FirstName, 
            request.LastName, 
            request.UserName, 
            cancellationToken);

        Logger.LogInformation("User {Email} registered successfully", request.Email);
        return Success(response, "User registered successfully. Please check your email for verification.");
    }
}