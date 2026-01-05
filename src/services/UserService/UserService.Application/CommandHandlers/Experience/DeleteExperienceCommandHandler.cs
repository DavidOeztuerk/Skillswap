using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Experience;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Experience;

public class DeleteExperienceCommandHandler(
    IUserExperienceRepository experienceRepository,
    ILogger<DeleteExperienceCommandHandler> logger)
    : BaseCommandHandler<DeleteExperienceCommand, bool>(logger)
{
    private readonly IUserExperienceRepository _experienceRepository = experienceRepository;

    public override async Task<ApiResponse<bool>> Handle(DeleteExperienceCommand request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Deleting experience {ExperienceId} for user {UserId}", request.ExperienceId, request.UserId);

        await _experienceRepository.DeleteExperience(request.ExperienceId, request.UserId, cancellationToken);

        return Success(true, "Experience deleted successfully");
    }
}
