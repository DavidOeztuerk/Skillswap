using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Experience;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Experience;

public class AddExperienceCommandHandler(
    IUserExperienceRepository experienceRepository,
    ILogger<AddExperienceCommandHandler> logger)
    : BaseCommandHandler<AddExperienceCommand, UserExperienceResponse>(logger)
{
    private readonly IUserExperienceRepository _experienceRepository = experienceRepository;

    public override async Task<ApiResponse<UserExperienceResponse>> Handle(AddExperienceCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.UserId))
        {
            return Error("User ID is required");
        }

        Logger.LogInformation("Adding experience for user {UserId}", request.UserId);

        var experience = UserExperience.Create(
            request.UserId!,
            request.Title,
            request.Company,
            request.StartDate,
            request.EndDate,
            request.Description,
            location: null,
            request.SortOrder);

        var result = await _experienceRepository.AddExperience(experience, cancellationToken);

        var response = new UserExperienceResponse(
            result.Id,
            result.Title,
            result.Company,
            result.StartDate,
            result.EndDate,
            result.Description,
            result.IsCurrent);

        return Success(response, "Experience added successfully");
    }
}
