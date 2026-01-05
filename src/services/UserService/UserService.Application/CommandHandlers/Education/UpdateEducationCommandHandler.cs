using CQRS.Handlers;
using CQRS.Models;
using Contracts.User.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Education;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Education;

public class UpdateEducationCommandHandler(
    IUserEducationRepository educationRepository,
    ILogger<UpdateEducationCommandHandler> logger)
    : BaseCommandHandler<UpdateEducationCommand, UserEducationResponse>(logger)
{
    private readonly IUserEducationRepository _educationRepository = educationRepository;

    public override async Task<ApiResponse<UserEducationResponse>> Handle(UpdateEducationCommand request, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Updating education {EducationId} for user {UserId}", request.EducationId, request.UserId);

        var education = await _educationRepository.GetEducationById(request.EducationId, cancellationToken);

        if (education == null)
            throw new ResourceNotFoundException("Education", request.EducationId);

        if (education.UserId != request.UserId)
            throw new InsufficientPermissionsException("You can only update your own education entries");

        education.Update(
            request.Degree,
            request.Institution,
            request.GraduationYear,
            request.GraduationMonth,
            request.Description,
            request.SortOrder);

        var result = await _educationRepository.UpdateEducation(education, cancellationToken);

        var response = new UserEducationResponse(
            result.Id,
            result.Degree,
            result.Institution,
            result.GraduationYear,
            result.GraduationMonth,
            result.Description);

        return Success(response, "Education updated successfully");
    }
}
