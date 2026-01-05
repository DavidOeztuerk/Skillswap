using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetUserEducationQueryHandler(
    IUserEducationRepository educationRepository,
    ILogger<GetUserEducationQueryHandler> logger)
    : BaseQueryHandler<GetUserEducationQuery, List<UserEducationResponse>>(logger)
{
    private readonly IUserEducationRepository _educationRepository = educationRepository;

    public override async Task<ApiResponse<List<UserEducationResponse>>> Handle(GetUserEducationQuery request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting education for user {UserId}", request.UserId);

        var education = await _educationRepository.GetUserEducation(request.UserId, cancellationToken);

        var response = education.Select(e => new UserEducationResponse(
            e.Id,
            e.Degree,
            e.Institution,
            e.GraduationYear,
            e.GraduationMonth,
            e.Description)).ToList();

        return Success(response);
    }
}
