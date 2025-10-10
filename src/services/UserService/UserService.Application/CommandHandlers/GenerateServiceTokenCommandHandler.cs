using Contracts.User.Responses.Auth;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers;

public class GenerateServiceTokenCommandHandler(
    IAuthRepository authRepository,
    ILogger<GenerateServiceTokenCommandHandler> logger)
    : BaseCommandHandler<GenerateServiceTokenCommand, ServiceTokenResponse>(logger)
{
    private readonly IAuthRepository _authRepository = authRepository;

    public override async Task<ApiResponse<ServiceTokenResponse>> Handle(
        GenerateServiceTokenCommand request,
        CancellationToken cancellationToken)
    {
        var result = await _authRepository.GenerateServiceToken(
            request.ServiceName,
            request.ServicePassword,
            cancellationToken);

        Logger.LogInformation("Service token generated for: {ServiceName}", request.ServiceName);

        return Success(result, "Service token generated successfully");
    }
}
