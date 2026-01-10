using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Education;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Education;

public class DeleteEducationCommandHandler(
    IUserEducationRepository educationRepository,
    ILogger<DeleteEducationCommandHandler> logger)
    : BaseCommandHandler<DeleteEducationCommand, bool>(logger)
{
    private readonly IUserEducationRepository _educationRepository = educationRepository;

    public override async Task<ApiResponse<bool>> Handle(DeleteEducationCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.UserId))
        {
            return Error("User ID is required");
        }

        Logger.LogInformation("Deleting education {EducationId} for user {UserId}", request.EducationId, request.UserId);

        await _educationRepository.DeleteEducation(request.EducationId, request.UserId!, cancellationToken);

        return Success(true, "Education deleted successfully");
    }
}
