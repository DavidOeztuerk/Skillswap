using Contracts.Chat.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Commands.Chat;

/// <summary>
/// Command to send a new chat message
/// </summary>
public record SendChatMessageCommand(
    string UserId,
    string UserName,
    string? UserAvatarUrl,
    string ThreadId,
    string Content,
    string MessageType = "Text",
    string Context = "Direct",
    string? ContextReferenceId = null,
    string? ReplyToMessageId = null,
    string? CodeLanguage = null,
    string? GiphyId = null,
    string? GifUrl = null,
    bool IsEncrypted = false,
    string? EncryptedContent = null,
    string? EncryptionKeyId = null,
    string? EncryptionIV = null) : ICommand<ChatMessageResponse>;

public class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    private static readonly string[] ValidMessageTypes =
        ["Text", "File", "Image", "CodeBlock", "GIF", "System", "Emoji", "Link"];

    private static readonly string[] ValidContexts =
        ["Direct", "MatchRequest", "Match", "Appointment", "VideoCall"];

    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.UserName)
            .NotEmpty().WithMessage("User name is required")
            .MaximumLength(200).WithMessage("User name must not exceed 200 characters");

        RuleFor(x => x.ThreadId)
            .NotEmpty().WithMessage("Thread ID is required");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Message content is required")
            .MaximumLength(10000).WithMessage("Message content must not exceed 10000 characters");

        RuleFor(x => x.MessageType)
            .Must(t => ValidMessageTypes.Contains(t))
            .WithMessage($"Message type must be one of: {string.Join(", ", ValidMessageTypes)}");

        RuleFor(x => x.Context)
            .Must(c => ValidContexts.Contains(c))
            .WithMessage($"Context must be one of: {string.Join(", ", ValidContexts)}");

        RuleFor(x => x.CodeLanguage)
            .MaximumLength(50).WithMessage("Code language must not exceed 50 characters");

        When(x => x.MessageType == "CodeBlock", () =>
        {
            RuleFor(x => x.CodeLanguage)
                .NotEmpty().WithMessage("Code language is required for code blocks");
        });

        When(x => x.MessageType == "GIF", () =>
        {
            RuleFor(x => x.GifUrl)
                .NotEmpty().WithMessage("GIF URL is required for GIF messages");
        });
    }
}
