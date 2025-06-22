using CQRS.Interfaces;
using Events;
using MassTransit;
using MediatR;

namespace NotificationService.Application.Consumers;

// ============================================================================
// USER REGISTRATION EVENT CONSUMERS
// ============================================================================

public class UserRegisteredEventConsumer(
    IMediator mediator,
    ILogger<UserRegisteredEventConsumer> logger)
    : IConsumer<UserRegisteredEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<UserRegisteredEventConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        await Task.Yield(); // Ensure async context
        try
        {
            _logger.LogInformation("Processing UserRegisteredEvent for {Email}", context.Message.Email);

            // Send welcome email (will be triggered after email verification)
            // For now, we don't send welcome email immediately

            _logger.LogInformation("UserRegisteredEvent processed successfully for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing UserRegisteredEvent for {Email}", context.Message.Email);
            throw; // Rethrow to trigger retry mechanism
        }
    }
}

public record UserRegisteredEvent(
    string Email,
    string FirstName,
    string LastName) : DomainEvent;

