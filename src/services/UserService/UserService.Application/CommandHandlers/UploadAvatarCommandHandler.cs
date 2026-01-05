using Contracts.User.Responses;
using UserService.Application.Commands;
using CQRS.Handlers;
using UserService.Domain.Repositories;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class UploadAvatarCommandHandler(
    IUserProfileRepository userProfileRepository,
    ILogger<UploadAvatarCommandHandler> logger)
    : BaseCommandHandler<UploadAvatarCommand, UploadAvatarResponse>(logger)
{
    private readonly IUserProfileRepository _userProfileRepository = userProfileRepository;

    public override async Task<ApiResponse<UploadAvatarResponse>> Handle(UploadAvatarCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null)
            throw new BusinessRuleViolationException("ERR_1002", "UserIdRequired", "UserId is required");

        Logger.LogInformation("Uploading avatar for user {UserId}, file: {FileName}, size: {Size} bytes",
            request.UserId, request.FileName, request.ImageData.Length);

        // Convert to Base64 DataURL for storage
        var base64 = Convert.ToBase64String(request.ImageData);
        var dataUrl = $"data:{request.ContentType};base64,{base64}";

        await _userProfileRepository.UploadAvatar(
            request.UserId,
            request.ImageData,
            request.FileName,
            request.ContentType,
            cancellationToken);

        Logger.LogInformation("Successfully uploaded avatar for user {UserId}", request.UserId);

        return Success(new UploadAvatarResponse(
            request.UserId,
            dataUrl,
            DateTime.UtcNow
        ));
    }
}
