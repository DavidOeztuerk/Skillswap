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
        try
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
        catch (InvalidOperationException ex) when (ex.Message.Contains("already registered"))
        {
            return Error("Email address is already registered");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error registering user {Email}", request.Email);
            return Error("An error occurred during registration. Please try again.");
        }
    }
}
