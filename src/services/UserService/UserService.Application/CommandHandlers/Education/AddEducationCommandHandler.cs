using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Education;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Education;

public class AddEducationCommandHandler(
    IUserEducationRepository educationRepository,
    ILogger<AddEducationCommandHandler> logger)
    : BaseCommandHandler<AddEducationCommand, UserEducationResponse>(logger)
{
    private readonly IUserEducationRepository _educationRepository = educationRepository;

    public override async Task<ApiResponse<UserEducationResponse>> Handle(AddEducationCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.UserId))
        {
            return Error("User ID is required");
        }

        Logger.LogInformation("Adding education for user {UserId}", request.UserId);

        var education = UserEducation.Create(
            request.UserId!,
            request.Degree,
            request.Institution,
            request.GraduationYear,
            request.GraduationMonth,
            request.Description,
            fieldOfStudy: null,
            startYear: null,
            startMonth: null,
            request.SortOrder);

        var result = await _educationRepository.AddEducation(education, cancellationToken);

        var response = new UserEducationResponse(
            result.Id,
            result.Degree,
            result.Institution,
            result.GraduationYear,
            result.GraduationMonth,
            result.Description);

        return Success(response, "Education added successfully");
    }
}
