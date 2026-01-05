using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetUserExperiencesQueryHandler(
    IUserExperienceRepository experienceRepository,
    ILogger<GetUserExperiencesQueryHandler> logger)
    : BaseQueryHandler<GetUserExperiencesQuery, List<UserExperienceResponse>>(logger)
{
    private readonly IUserExperienceRepository _experienceRepository = experienceRepository;

    public override async Task<ApiResponse<List<UserExperienceResponse>>> Handle(GetUserExperiencesQuery request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting experiences for user {UserId}", request.UserId);

        var experiences = await _experienceRepository.GetUserExperiences(request.UserId, cancellationToken);

        var response = experiences.Select(e => new UserExperienceResponse(
            e.Id,
            e.Title,
            e.Company,
            e.StartDate,
            e.EndDate,
            e.Description,
            e.IsCurrent)).ToList();

        return Success(response);
    }
}
