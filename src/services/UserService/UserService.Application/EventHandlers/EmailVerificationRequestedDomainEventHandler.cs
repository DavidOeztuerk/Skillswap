// using CQRS.Handlers;
// using MassTransit;
// using Events.Domain.User;
// using Microsoft.Extensions.Logging;

// namespace UserService.Application.EventHandlers;

// public class EmailVerificationRequestedDomainEventHandler(
//     IPublishEndpoint publishEndpoint,
//     ILogger<EmailVerificationRequestedDomainEventHandler> logger)
//     : BaseDomainEventHandler<EmailVerificationRequestedDomainEvent>(logger)
// {
//     private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

//     protected override async Task HandleDomainEvent(
//         EmailVerificationRequestedDomainEvent domainEvent,
//         CancellationToken cancellationToken)
//     {
//         // Publish to message bus for NotificationService to handle via shared contract
//         // NOTE: The integration event is now published from RegisterUserCommandHandler
//         // This handler is kept for future enhancements and audit trail
//         Logger.LogInformation("Email verification requested for user {UserId}",
//             domainEvent.UserId);
//     }
// }
