using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Commands.Review;

public record CreateReviewCommand(
    string RevieweeId,
    int Rating,
    string? ReviewText = null,
    string? SessionId = null,
    string? SkillId = null) : ICommand<UserReviewResponse>
{
    public string ReviewerId { get; set; } = string.Empty;
}
