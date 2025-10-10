using Contracts.User.Responses.Auth;
using CQRS.Interfaces;

namespace UserService.Application.Commands;

public record GenerateServiceTokenCommand(
    string ServiceName,
    string ServicePassword) : ICommand<ServiceTokenResponse>;
