using CQRS.Handlers;
using UserService.Domain.Repositories;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using CQRS.Models;
using Core.Common.Exceptions;

namespace UserService.Application.QueryHandlers;

public class GetUserByEmailQueryHandler(
    IUserRepository userRepository,
    ILogger<GetUserByEmailQueryHandler> logger)
    : BaseQueryHandler<GetUserByEmailQuery, UserSummaryResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<ApiResponse<UserSummaryResponse>> Handle(
        GetUserByEmailQuery request,
        CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetUserByEmailWithRoles(request.Email, cancellationToken);

        if (user == null)
        {
            throw new ResourceNotFoundException("User", request.Email);
        }

        var response = new UserSummaryResponse(
            user.Id,
            user.FirstName,
            user.LastName,
            user.UserName);

        Logger.LogInformation("Retrieved user by email {Email}", request.Email);
        return Success(response);
    }
}