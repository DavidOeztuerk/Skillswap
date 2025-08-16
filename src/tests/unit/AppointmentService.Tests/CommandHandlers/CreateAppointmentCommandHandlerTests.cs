using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using AppointmentService.Application.CommandHandlers;
using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Infrastructure;
using Xunit;
using Events.Integration.Appointment;
using Bogus;

namespace AppointmentService.Tests.CommandHandlers;

public class CreateAppointmentCommandHandlerTests : BaseUnitTest
{
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly Mock<ILogger<CreateAppointmentCommandHandler>> _mockLogger;
    private readonly CreateAppointmentCommandHandler _handler;
    private readonly AppointmentDbContext _context;
    private readonly Faker _faker;

    public CreateAppointmentCommandHandlerTests()
    {
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        _mockLogger = new Mock<ILogger<CreateAppointmentCommandHandler>>();
        _faker = new Faker();

        var options = new DbContextOptionsBuilder<AppointmentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppointmentDbContext(options);

        _handler = new CreateAppointmentCommandHandler(
            _context,
            _mockPublishEndpoint.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task Handle_WithValidData_ShouldCreateAppointmentSuccessfully()
    {
        // Arrange
        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            Title = _faker.Lorem.Sentence(3),
            Description = _faker.Lorem.Paragraph(),
            Location = _faker.Address.FullAddress(),
            IsOnline = true
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.MatchId.Should().Be(command.MatchId);
        result.Data.ScheduledAt.Should().Be(command.ScheduledAt);
        result.Data.Duration.Should().Be(command.Duration);
        result.Data.Status.Should().Be("Scheduled");

        // Verify appointment was saved to database
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.MatchId == command.MatchId);
        appointment.Should().NotBeNull();
        appointment!.Title.Should().Be(command.Title);
        appointment.Description.Should().Be(command.Description);

        // Verify event was published
        _mockPublishEndpoint.Verify(x => x.Publish(
            It.Is<AppointmentCreatedIntegrationEvent>(e => 
                e.AppointmentId == appointment.Id &&
                e.MatchId == command.MatchId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithPastScheduledDate_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(-1), // Past date
            Duration = TimeSpan.FromMinutes(60),
            Title = _faker.Lorem.Sentence(3)
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot be in the past");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<AppointmentCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithDuplicateAppointmentForMatch_ShouldReturnFailure()
    {
        // Arrange
        var matchId = Guid.NewGuid();

        // Create existing appointment
        var existingAppointment = new Appointment
        {
            Id = Guid.NewGuid(),
            MatchId = matchId,
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(2),
            Duration = TimeSpan.FromMinutes(60),
            Status = AppointmentStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Appointments.Add(existingAppointment);
        await _context.SaveChangesAsync();

        var command = new CreateAppointmentCommand
        {
            MatchId = matchId, // Same match
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            Title = _faker.Lorem.Sentence(3)
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already has an active appointment");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<AppointmentCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithInvalidDuration_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(0), // Invalid duration
            Title = _faker.Lorem.Sentence(3)
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Duration must be greater than zero");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<AppointmentCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithOnlineAppointment_ShouldGenerateMeetingLink()
    {
        // Arrange
        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            Title = _faker.Lorem.Sentence(3),
            IsOnline = true
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.MeetingLink.Should().NotBeNullOrEmpty();
        result.Data.MeetingLink.Should().StartWith("https://meet.skillswap.com/");

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.MatchId == command.MatchId);
        appointment.Should().NotBeNull();
        appointment!.MeetingLink.Should().NotBeNullOrEmpty();
        appointment.IsOnline.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithOfflineAppointment_ShouldNotGenerateMeetingLink()
    {
        // Arrange
        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            Title = _faker.Lorem.Sentence(3),
            Location = _faker.Address.FullAddress(),
            IsOnline = false
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.MeetingLink.Should().BeNullOrEmpty();
        result.Data.Location.Should().Be(command.Location);

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.MatchId == command.MatchId);
        appointment.Should().NotBeNull();
        appointment!.MeetingLink.Should().BeNullOrEmpty();
        appointment.IsOnline.Should().BeFalse();
        appointment.Location.Should().Be(command.Location);
    }

    [Fact]
    public async Task Handle_ShouldSetCorrectDefaultStatus()
    {
        // Arrange
        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            Title = _faker.Lorem.Sentence(3)
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        
        var appointment = await _context.Appointments.FirstOrDefaultAsync();
        appointment.Should().NotBeNull();
        appointment!.Status.Should().Be(AppointmentStatus.Scheduled);
        appointment.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        appointment.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task Handle_WithConflictingTimeSlot_ShouldReturnFailure()
    {
        // Arrange
        var providerId = Guid.NewGuid();
        var scheduledTime = DateTime.UtcNow.AddDays(3).Date.AddHours(14); // 2 PM

        // Create existing appointment for provider
        var existingAppointment = new Appointment
        {
            Id = Guid.NewGuid(),
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = providerId,
            ScheduledAt = scheduledTime,
            Duration = TimeSpan.FromMinutes(60),
            Status = AppointmentStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Appointments.Add(existingAppointment);
        await _context.SaveChangesAsync();

        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = providerId, // Same provider
            SkillId = Guid.NewGuid(),
            ScheduledAt = scheduledTime.AddMinutes(30), // Overlapping time
            Duration = TimeSpan.FromMinutes(60),
            Title = _faker.Lorem.Sentence(3)
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("time slot conflict");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<AppointmentCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenDatabaseThrowsException_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateAppointmentCommand
        {
            MatchId = Guid.NewGuid(),
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            ScheduledAt = DateTime.UtcNow.AddDays(3),
            Duration = TimeSpan.FromMinutes(60),
            Title = null! // This will cause a database exception
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("error");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<AppointmentCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    public override void Dispose()
    {
        _context?.Dispose();
        base.Dispose();
    }
}