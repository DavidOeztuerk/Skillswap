using UserService.Application.Queries;
using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Domain.Repositories;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Api.Application.Queries;
using CQRS.Models;

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
        try
        {
            var user = await _userRepository.GetUserByEmailWithRoles(request.Email, cancellationToken);

            if (user == null)
            {
                return Error("No user with given email found");
            }

            var response = new UserSummaryResponse(
                user.Id,
                user.FirstName,
                user.LastName,
                user.UserName,
                user.FavoriteSkillIds);

            Logger.LogInformation("Retrieved user by email {Email}", request.Email);
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving user by email {Email}", request.Email);
            return Error("An error occurred while retrieving user");
        }
    }
}