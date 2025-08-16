using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using MatchmakingService.Application.CommandHandlers;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService;
using Xunit;
using Events.Integration.Matchmaking;
using Bogus;
using System.Net.Http;
using System.Net;
using Moq.Protected;
using System.Text.Json;
using System.Threading.Tasks;
using System;
using System.Threading;

namespace MatchmakingService.Tests.CommandHandlers;

public class CreateMatchRequestCommandHandlerTests : BaseUnitTest
{
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly Mock<ILogger<CreateMatchRequestCommandHandler>> _mockLogger;
    private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
    private readonly CreateMatchRequestCommandHandler _handler;
    private readonly MatchmakingDbContext _context;
    private readonly Faker _faker;

    public CreateMatchRequestCommandHandlerTests()
    {
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        _mockLogger = new Mock<ILogger<CreateMatchRequestCommandHandler>>();
        _mockHttpClientFactory = new Mock<IHttpClientFactory>();
        _faker = new Faker();

        var options = new DbContextOptionsBuilder<MatchmakingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new MatchmakingDbContext(options);

        _handler = new CreateMatchRequestCommandHandler(
            _context,
            _mockPublishEndpoint.Object,
            _mockHttpClientFactory.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task Handle_WithValidData_ShouldCreateMatchRequestSuccessfully()
    {
        // Arrange
        var command = new CreateMatchRequestCommand
        {
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            Message = _faker.Lorem.Paragraph(),
            PreferredSchedule = DateTime.UtcNow.AddDays(7),
            Duration = 60,
            SessionType = "Online"
        };

        SetupHttpClient(true, true); // Both users and skill exist

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.RequesterId.Should().Be(command.RequesterId);
        result.Data.ProviderId.Should().Be(command.ProviderId);
        result.Data.SkillId.Should().Be(command.SkillId);
        result.Data.Status.Should().Be("Pending");

        // Verify match request was saved to database
        var matchRequest = await _context.Matches
            .FirstOrDefaultAsync(m => m.RequesterId == command.RequesterId && m.ProviderId == command.ProviderId);
        matchRequest.Should().NotBeNull();
        matchRequest!.Message.Should().Be(command.Message);

        // Verify event was published
        _mockPublishEndpoint.Verify(x => x.Publish(
            It.Is<MatchRequestCreatedIntegrationEvent>(e => 
                e.RequesterId == command.RequesterId && 
                e.ProviderId == command.ProviderId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithSelfMatch_ShouldReturnFailure()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new CreateMatchRequestCommand
        {
            RequesterId = userId,
            ProviderId = userId, // Same as requester
            SkillId = Guid.NewGuid(),
            Message = _faker.Lorem.Paragraph()
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot request a match with yourself");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<MatchRequestCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithExistingPendingMatch_ShouldReturnFailure()
    {
        // Arrange
        var requesterId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var skillId = Guid.NewGuid();

        // Create existing pending match
        var existingMatch = new Match
        {
            Id = Guid.NewGuid(),
            RequesterId = requesterId,
            ProviderId = providerId,
            SkillId = skillId,
            Status = MatchStatus.Pending,
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        _context.Matches.Add(existingMatch);
        await _context.SaveChangesAsync();

        var command = new CreateMatchRequestCommand
        {
            RequesterId = requesterId,
            ProviderId = providerId,
            SkillId = skillId,
            Message = _faker.Lorem.Paragraph()
        };

        SetupHttpClient(true, true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already exists");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<MatchRequestCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithNonExistentRequester_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateMatchRequestCommand
        {
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            Message = _faker.Lorem.Paragraph()
        };

        SetupHttpClient(false, true); // Requester doesn't exist

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Requester not found");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<MatchRequestCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithNonExistentProvider_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateMatchRequestCommand
        {
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            Message = _faker.Lorem.Paragraph()
        };

        SetupHttpClient(true, false, false); // Provider doesn't exist

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Provider not found");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<MatchRequestCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithNonExistentSkill_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateMatchRequestCommand
        {
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            Message = _faker.Lorem.Paragraph()
        };

        SetupHttpClient(true, true, false); // Skill doesn't exist

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Skill not found");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<MatchRequestCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldSetCorrectDefaultValues()
    {
        // Arrange
        var command = new CreateMatchRequestCommand
        {
            RequesterId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            SkillId = Guid.NewGuid(),
            Message = _faker.Lorem.Paragraph()
            // No PreferredSchedule, Duration, or SessionType
        };

        SetupHttpClient(true, true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        
        var match = await _context.Matches.FirstOrDefaultAsync();
        match.Should().NotBeNull();
        match!.Status.Should().Be(MatchStatus.Pending);
        match.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        match.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        match.ExpiresAt.Should().BeAfter(DateTime.UtcNow.AddDays(6));
    }

    [Fact]
    public async Task Handle_WithCompletedPreviousMatch_ShouldAllowNewMatch()
    {
        // Arrange
        var requesterId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var skillId = Guid.NewGuid();

        // Create existing completed match
        var existingMatch = new Match
        {
            Id = Guid.NewGuid(),
            RequesterId = requesterId,
            ProviderId = providerId,
            SkillId = skillId,
            Status = MatchStatus.Completed,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            CompletedAt = DateTime.UtcNow.AddDays(-25)
        };
        _context.Matches.Add(existingMatch);
        await _context.SaveChangesAsync();

        var command = new CreateMatchRequestCommand
        {
            RequesterId = requesterId,
            ProviderId = providerId,
            SkillId = skillId,
            Message = _faker.Lorem.Paragraph()
        };

        SetupHttpClient(true, true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();

        var matches = await _context.Matches.Where(m => m.RequesterId == requesterId).ToListAsync();
        matches.Should().HaveCount(2);
        matches.Should().Contain(m => m.Status == MatchStatus.Pending);
    }

    private void SetupHttpClient(bool requesterExists = true, bool providerExists = true, bool skillExists = true)
    {
        var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        
        // Setup user validation responses
        mockHttpMessageHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().Contains("/users/") && 
                    req.RequestUri.ToString().Contains(req.RequestUri.Segments.Last())),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync((HttpRequestMessage request, CancellationToken token) =>
            {
                var userId = request.RequestUri!.Segments.Last();
                bool exists = requesterExists;
                
                if (request.RequestUri.ToString().Contains("provider"))
                    exists = providerExists;
                
                return new HttpResponseMessage
                {
                    StatusCode = exists ? HttpStatusCode.OK : HttpStatusCode.NotFound,
                    Content = new StringContent(JsonSerializer.Serialize(new { exists = exists }))
                };
            });

        // Setup skill validation response
        mockHttpMessageHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().Contains("/skills/")),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = skillExists ? HttpStatusCode.OK : HttpStatusCode.NotFound,
                Content = new StringContent(JsonSerializer.Serialize(new { exists = skillExists }))
            });

        var httpClient = new HttpClient(mockHttpMessageHandler.Object)
        {
            BaseAddress = new Uri("http://localhost:8080")
        };

        _mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(httpClient);
    }

    public override void Dispose()
    {
        _context?.Dispose();
        base.Dispose();
    }
}