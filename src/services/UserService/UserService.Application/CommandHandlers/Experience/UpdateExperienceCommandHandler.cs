using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Experience;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Experience;

public class UpdateExperienceCommandHandler(
    IUserExperienceRepository experienceRepository,
    ILogger<UpdateExperienceCommandHandler> logger)
    : BaseCommandHandler<UpdateExperienceCommand, UserExperienceResponse>(logger)
{
    private readonly IUserExperienceRepository _experienceRepository = experienceRepository;

    public override async Task<ApiResponse<UserExperienceResponse>> Handle(UpdateExperienceCommand request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Updating experience {ExperienceId} for user {UserId}", request.ExperienceId, request.UserId);

        var experience = await _experienceRepository.GetExperienceById(request.ExperienceId, cancellationToken);

        if (experience == null)
            throw new ResourceNotFoundException("Experience", request.ExperienceId);

        if (experience.UserId != request.UserId)
            throw new InsufficientPermissionsException("You can only update your own experiences");

        experience.Update(
            request.Title,
            request.Company,
            request.StartDate,
            request.EndDate,
            request.Description,
            location: null,
            request.SortOrder);

        var result = await _experienceRepository.UpdateExperience(experience, cancellationToken);

        var response = new UserExperienceResponse(
            result.Id,
            result.Title,
            result.Company,
            result.StartDate,
            result.EndDate,
            result.Description,
            result.IsCurrent);

        return Success(response, "Experience updated successfully");
    }
}
