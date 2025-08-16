using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Testing;
using SkillService.Application.CommandHandlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using SkillService.Domain.ValueObjects;
using SkillService;
using Xunit;
using Core.Events.Integration.Skill;
using Bogus;
using Core.CQRS.Models;
using Contracts.Skill.Responses;

namespace SkillService.Tests.CommandHandlers;

public class CreateSkillCommandHandlerTests : BaseUnitTest
{
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly Mock<ILogger<CreateSkillCommandHandler>> _mockLogger;
    private readonly CreateSkillCommandHandler _handler;
    private readonly SkillDbContext _context;
    private readonly Faker _faker;

    public CreateSkillCommandHandlerTests()
    {
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        _mockLogger = new Mock<ILogger<CreateSkillCommandHandler>>();
        _faker = new Faker();

        var options = new DbContextOptionsBuilder<SkillDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new SkillDbContext(options);

        _handler = new CreateSkillCommandHandler(
            _context,
            _mockPublishEndpoint.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task Handle_WithValidData_ShouldCreateSkillSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = await CreateTestCategory();
        var proficiency = await CreateTestProficiency();

        var command = new CreateSkillCommand
        {
            UserId = userId,
            Name = _faker.Lorem.Word(),
            Description = _faker.Lorem.Sentence(),
            CategoryId = category.Id,
            ProficiencyLevelId = proficiency.Id,
            IsOffering = true,
            IsRequesting = false
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Name.Should().Be(command.Name);
        result.Data.Description.Should().Be(command.Description);
        result.Data.CategoryId.Should().Be(category.Id);
        result.Data.ProficiencyLevelId.Should().Be(proficiency.Id);

        // Verify skill was saved to database
        var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Name == command.Name);
        skill.Should().NotBeNull();
        skill!.UserId.Should().Be(userId);

        // Verify event was published
        _mockPublishEndpoint.Verify(x => x.Publish(
            It.Is<SkillCreatedIntegrationEvent>(e => e.SkillId == skill.Id),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithDuplicateSkillForUser_ShouldReturnFailure()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var skillName = _faker.Lorem.Word();
        var category = await CreateTestCategory();
        var proficiency = await CreateTestProficiency();

        // Create existing skill
        var existingSkill = new Skill
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = skillName,
            Description = _faker.Lorem.Sentence(),
            CategoryId = category.Id,
            ProficiencyLevelId = proficiency.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Skills.Add(existingSkill);
        await _context.SaveChangesAsync();

        var command = new CreateSkillCommand
        {
            UserId = userId,
            Name = skillName, // Same name for same user
            Description = _faker.Lorem.Sentence(),
            CategoryId = category.Id,
            ProficiencyLevelId = proficiency.Id,
            IsOffering = true
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already exists");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<SkillCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithInvalidCategoryId_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateSkillCommand
        {
            UserId = Guid.NewGuid(),
            Name = _faker.Lorem.Word(),
            Description = _faker.Lorem.Sentence(),
            CategoryId = Guid.NewGuid(), // Non-existent category
            ProficiencyLevelId = Guid.NewGuid(),
            IsOffering = true
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Category not found");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<SkillCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithInvalidProficiencyId_ShouldReturnFailure()
    {
        // Arrange
        var category = await CreateTestCategory();

        var command = new CreateSkillCommand
        {
            UserId = Guid.NewGuid(),
            Name = _faker.Lorem.Word(),
            Description = _faker.Lorem.Sentence(),
            CategoryId = category.Id,
            ProficiencyLevelId = Guid.NewGuid(), // Non-existent proficiency
            IsOffering = true
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Proficiency level not found");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<SkillCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldSetCorrectTimestamps()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = await CreateTestCategory();
        var proficiency = await CreateTestProficiency();

        var command = new CreateSkillCommand
        {
            UserId = userId,
            Name = _faker.Lorem.Word(),
            Description = _faker.Lorem.Sentence(),
            CategoryId = category.Id,
            ProficiencyLevelId = proficiency.Id,
            IsOffering = true
        };

        // Act
        var beforeCreate = DateTime.UtcNow;
        var result = await _handler.Handle(command, CancellationToken.None);
        var afterCreate = DateTime.UtcNow;

        // Assert
        result.IsSuccess.Should().BeTrue();
        
        var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Name == command.Name);
        skill.Should().NotBeNull();
        skill!.CreatedAt.Should().BeAfter(beforeCreate.AddSeconds(-1));
        skill.CreatedAt.Should().BeBefore(afterCreate.AddSeconds(1));
        skill.UpdatedAt.Should().BeCloseTo(skill.CreatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task Handle_WithOfferingAndRequesting_ShouldSetBothFlags()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = await CreateTestCategory();
        var proficiency = await CreateTestProficiency();

        var command = new CreateSkillCommand
        {
            UserId = userId,
            Name = _faker.Lorem.Word(),
            Description = _faker.Lorem.Sentence(),
            CategoryId = category.Id,
            ProficiencyLevelId = proficiency.Id,
            IsOffering = true,
            IsRequesting = true
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsOffering.Should().BeTrue();
        result.Data.IsRequesting.Should().BeTrue();

        var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Name == command.Name);
        skill.Should().NotBeNull();
        skill!.IsOffering.Should().BeTrue();
        skill.IsRequesting.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenDatabaseThrowsException_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateSkillCommand
        {
            UserId = Guid.NewGuid(),
            Name = null!, // This will cause a database exception
            Description = _faker.Lorem.Sentence(),
            CategoryId = Guid.NewGuid(),
            ProficiencyLevelId = Guid.NewGuid(),
            IsOffering = true
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("error");
        result.Data.Should().BeNull();

        _mockPublishEndpoint.Verify(x => x.Publish(
            It.IsAny<SkillCreatedIntegrationEvent>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    private async Task<SkillCategory> CreateTestCategory()
    {
        var category = new SkillCategory
        {
            Id = Guid.NewGuid(),
            Name = _faker.Commerce.Categories(1)[0],
            Description = _faker.Lorem.Sentence(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.SkillCategories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    private async Task<ProficiencyLevel> CreateTestProficiency()
    {
        var proficiency = new ProficiencyLevel
        {
            Id = Guid.NewGuid(),
            Name = _faker.PickRandom("Beginner", "Intermediate", "Advanced", "Expert"),
            Level = _faker.Random.Int(1, 5),
            Description = _faker.Lorem.Sentence(),
            CreatedAt = DateTime.UtcNow
        };
        _context.ProficiencyLevels.Add(proficiency);
        await _context.SaveChangesAsync();
        return proficiency;
    }

    public override void Dispose()
    {
        _context?.Dispose();
        base.Dispose();
    }
}