using FluentAssertions;
using MassTransit;
using MassTransit.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using NotificationService.Application.Consumers;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Services;
using NotificationService;
using Xunit;
using Core.Events.Integration.Appointment;
using Bogus;

namespace NotificationService.Tests.Consumers;

public class AppointmentCreatedEventConsumerTests : BaseUnitTest
{
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<ISmsService> _mockSmsService;
    private readonly Mock<ILogger<AppointmentCreatedEventConsumer>> _mockLogger;
    private readonly NotificationDbContext _context;
    private readonly Faker _faker;
    private readonly IServiceProvider _serviceProvider;

    public AppointmentCreatedEventConsumerTests()
    {
        _mockEmailService = new Mock<IEmailService>();
        _mockSmsService = new Mock<ISmsService>();
        _mockLogger = new Mock<ILogger<AppointmentCreatedEventConsumer>>();
        _faker = new Faker();

        var options = new DbContextOptionsBuilder<NotificationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new NotificationDbContext(options);

        var services = new ServiceCollection();
        services.AddSingleton(_mockEmailService.Object);
        services.AddSingleton(_mockSmsService.Object);
        services.AddSingleton(_mockLogger.Object);
        services.AddSingleton(_context);
        
        services.AddMassTransitTestHarness(cfg =>
        {
            cfg.AddConsumer<AppointmentCreatedEventConsumer>();
        });

        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task Consume_WithValidEvent_ShouldSendNotifications()
    {
        // Arrange
        var harness = _serviceProvider.GetRequiredService<ITestHarness>();
        await harness.Start();

        var appointmentEvent = new AppointmentCreatedIntegrationEvent
        {
            AppointmentId = Guid.NewGuid(),
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            RequesterEmail = _faker.Internet.Email(),
            ProviderEmail = _faker.Internet.Email(),
            RequesterName = _faker.Name.FullName(),
            ProviderName = _faker.Name.FullName()
        };

        _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<List<string>>()))
            .ReturnsAsync(true);

        // Act
        await harness.Bus.Publish(appointmentEvent);

        // Assert
        Assert.True(await harness.Consumed.Any<AppointmentCreatedIntegrationEvent>());

        var consumer = harness.GetConsumerHarness<AppointmentCreatedEventConsumer>();
        Assert.True(await consumer.Consumed.Any<AppointmentCreatedIntegrationEvent>());

        // Verify emails were sent
        _mockEmailService.Verify(x => x.SendEmailAsync(
            appointmentEvent.RequesterEmail,
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<bool>(),
            It.IsAny<List<string>>()), Times.Once);

        _mockEmailService.Verify(x => x.SendEmailAsync(
            appointmentEvent.ProviderEmail,
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<bool>(),
            It.IsAny<List<string>>()), Times.Once);

        await harness.Stop();
    }

    [Fact]
    public async Task Consume_ShouldCreateNotificationRecords()
    {
        // Arrange
        var consumer = new AppointmentCreatedEventConsumer(
            _context,
            _mockEmailService.Object,
            _mockSmsService.Object,
            _mockLogger.Object
        );

        var appointmentEvent = new AppointmentCreatedIntegrationEvent
        {
            AppointmentId = Guid.NewGuid(),
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            RequesterEmail = _faker.Internet.Email(),
            ProviderEmail = _faker.Internet.Email(),
            RequesterName = _faker.Name.FullName(),
            ProviderName = _faker.Name.FullName()
        };

        _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<List<string>>()))
            .ReturnsAsync(true);

        var context = Mock.Of<ConsumeContext<AppointmentCreatedIntegrationEvent>>(x => x.Message == appointmentEvent);

        // Act
        await consumer.Consume(context);

        // Assert
        var notifications = await _context.Notifications.ToListAsync();
        notifications.Should().HaveCount(2); // One for requester, one for provider

        var requesterNotification = notifications.FirstOrDefault(n => n.UserId == appointmentEvent.RequesterId);
        requesterNotification.Should().NotBeNull();
        requesterNotification!.Title.Should().Contain("Appointment Scheduled");
        requesterNotification.Status.Should().Be(NotificationStatus.Sent);

        var providerNotification = notifications.FirstOrDefault(n => n.UserId == appointmentEvent.ProviderId);
        providerNotification.Should().NotBeNull();
        providerNotification!.Title.Should().Contain("Appointment Scheduled");
        providerNotification.Status.Should().Be(NotificationStatus.Sent);
    }

    [Fact]
    public async Task Consume_WhenEmailFails_ShouldMarkNotificationAsFailed()
    {
        // Arrange
        var consumer = new AppointmentCreatedEventConsumer(
            _context,
            _mockEmailService.Object,
            _mockSmsService.Object,
            _mockLogger.Object
        );

        var appointmentEvent = new AppointmentCreatedIntegrationEvent
        {
            AppointmentId = Guid.NewGuid(),
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            RequesterEmail = _faker.Internet.Email(),
            ProviderEmail = _faker.Internet.Email(),
            RequesterName = _faker.Name.FullName(),
            ProviderName = _faker.Name.FullName()
        };

        _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<List<string>>()))
            .ReturnsAsync(false); // Email fails

        var context = Mock.Of<ConsumeContext<AppointmentCreatedIntegrationEvent>>(x => x.Message == appointmentEvent);

        // Act
        await consumer.Consume(context);

        // Assert
        var notifications = await _context.Notifications.ToListAsync();
        notifications.Should().HaveCount(2);
        notifications.Should().AllSatisfy(n => n.Status.Should().Be(NotificationStatus.Failed));
    }

    [Fact]
    public async Task Consume_WithNullEmails_ShouldHandleGracefully()
    {
        // Arrange
        var consumer = new AppointmentCreatedEventConsumer(
            _context,
            _mockEmailService.Object,
            _mockSmsService.Object,
            _mockLogger.Object
        );

        var appointmentEvent = new AppointmentCreatedIntegrationEvent
        {
            AppointmentId = Guid.NewGuid(),
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            RequesterEmail = null!, // Null email
            ProviderEmail = null!, // Null email
            RequesterName = _faker.Name.FullName(),
            ProviderName = _faker.Name.FullName()
        };

        var context = Mock.Of<ConsumeContext<AppointmentCreatedIntegrationEvent>>(x => x.Message == appointmentEvent);

        // Act
        var act = () => consumer.Consume(context);

        // Assert
        await act.Should().NotThrowAsync();
        
        _mockLogger.Verify(x => x.Log(
            LogLevel.Warning,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("email address")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.AtLeastOnce);
    }

    public override void Dispose()
    {
        _context?.Dispose();
        _serviceProvider?.Dispose();
        base.Dispose();
    }
}