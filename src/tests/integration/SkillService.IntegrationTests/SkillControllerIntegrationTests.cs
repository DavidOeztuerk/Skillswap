using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Testing;
using SkillService;
using SkillService.Domain.Entities;
using Xunit;
using Contracts.Skill.Requests;
using Contracts.Skill.Responses;
using Core.CQRS.Models;
using Microsoft.EntityFrameworkCore;
using Bogus;

namespace SkillService.IntegrationTests;

[Collection("Database")]
public class SkillControllerIntegrationTests : BaseIntegrationTest<Program, SkillDbContext>
{
    private readonly Faker _faker;

    public SkillControllerIntegrationTests(IntegrationTestWebAppFactory<Program, SkillDbContext> factory) 
        : base(factory)
    {
        _faker = new Faker();
    }

    [Fact]
    public async Task CreateSkill_WithValidData_ShouldCreateNewSkill()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = await SeedCategory();
        var proficiency = await SeedProficiencyLevel();

        var request = new CreateSkillRequest
        {
            UserId = userId,
            Name = _faker.Lorem.Word(),
            Description = _faker.Lorem.Sentence(),
            CategoryId = category.Id,
            ProficiencyLevelId = proficiency.Id,
            IsOffering = true,
            IsRequesting = false
        };

        SetTestAuthenticationHeader(userId.ToString(), new[] { "User" });

        // Act
        var response = await Client.PostAsJsonAsync("/api/skills", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<GetSkillResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data!.Name.Should().Be(request.Name);
        content.Data.Description.Should().Be(request.Description);
        content.Data.CategoryId.Should().Be(category.Id);

        // Verify skill was created in database
        await ExecuteDbContextAsync(async db =>
        {
            var skill = await db.Skills.FirstOrDefaultAsync(s => s.Name == request.Name && s.UserId == userId);
            skill.Should().NotBeNull();
            skill!.Description.Should().Be(request.Description);
            skill.IsOffering.Should().BeTrue();
            skill.IsRequesting.Should().BeFalse();
        });
    }

    [Fact]
    public async Task GetUserSkills_ShouldReturnUserSkills()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = await SeedCategory();
        var proficiency = await SeedProficiencyLevel();

        // Create multiple skills for user
        await ExecuteDbContextAsync(async db =>
        {
            for (int i = 0; i < 3; i++)
            {
                var skill = new Skill
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = $"Skill {i}",
                    Description = _faker.Lorem.Sentence(),
                    CategoryId = category.Id,
                    ProficiencyLevelId = proficiency.Id,
                    IsOffering = i % 2 == 0,
                    IsRequesting = i % 2 == 1,
                    CreatedAt = DateTime.UtcNow
                };
                db.Skills.Add(skill);
            }
            await db.SaveChangesAsync();
        });

        SetTestAuthenticationHeader(userId.ToString(), new[] { "User" });

        // Act
        var response = await Client.GetAsync($"/api/skills/user/{userId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<GetUserSkillsResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data!.Skills.Should().HaveCount(3);
        content.Data.Skills.Should().AllSatisfy(s => s.UserId.Should().Be(userId));
    }

    [Fact]
    public async Task UpdateSkill_ShouldUpdateExistingSkill()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = await SeedCategory();
        var proficiency = await SeedProficiencyLevel();
        
        // Create skill
        var skillId = Guid.NewGuid();
        await ExecuteDbContextAsync(async db =>
        {
            var skill = new Skill
            {
                Id = skillId,
                UserId = userId,
                Name = "Original Name",
                Description = "Original Description",
                CategoryId = category.Id,
                ProficiencyLevelId = proficiency.Id,
                IsOffering = true,
                IsRequesting = false,
                CreatedAt = DateTime.UtcNow
            };
            db.Skills.Add(skill);
            await db.SaveChangesAsync();
        });

        var request = new UpdateSkillRequest
        {
            Name = "Updated Name",
            Description = "Updated Description",
            IsOffering = false,
            IsRequesting = true
        };

        SetTestAuthenticationHeader(userId.ToString(), new[] { "User" });

        // Act
        var response = await Client.PutAsJsonAsync($"/api/skills/{skillId}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<GetSkillResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data!.Name.Should().Be("Updated Name");
        content.Data.Description.Should().Be("Updated Description");

        // Verify skill was updated in database
        await ExecuteDbContextAsync(async db =>
        {
            var skill = await db.Skills.FindAsync(skillId);
            skill.Should().NotBeNull();
            skill!.Name.Should().Be("Updated Name");
            skill.Description.Should().Be("Updated Description");
            skill.IsOffering.Should().BeFalse();
            skill.IsRequesting.Should().BeTrue();
        });
    }

    [Fact]
    public async Task DeleteSkill_ShouldRemoveSkill()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var category = await SeedCategory();
        var proficiency = await SeedProficiencyLevel();
        
        // Create skill
        var skillId = Guid.NewGuid();
        await ExecuteDbContextAsync(async db =>
        {
            var skill = new Skill
            {
                Id = skillId,
                UserId = userId,
                Name = "Skill to Delete",
                Description = "Will be deleted",
                CategoryId = category.Id,
                ProficiencyLevelId = proficiency.Id,
                CreatedAt = DateTime.UtcNow
            };
            db.Skills.Add(skill);
            await db.SaveChangesAsync();
        });

        SetTestAuthenticationHeader(userId.ToString(), new[] { "User" });

        // Act
        var response = await Client.DeleteAsync($"/api/skills/{skillId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().BeTrue();

        // Verify skill was deleted from database
        await ExecuteDbContextAsync(async db =>
        {
            var skill = await db.Skills.FindAsync(skillId);
            skill.Should().BeNull();
        });
    }

    [Fact]
    public async Task SearchSkills_ShouldReturnMatchingSkills()
    {
        // Arrange
        var category = await SeedCategory();
        var proficiency = await SeedProficiencyLevel();

        // Create skills
        await ExecuteDbContextAsync(async db =>
        {
            var skills = new[]
            {
                new Skill { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Name = "C# Programming", Description = "Advanced C# skills", CategoryId = category.Id, ProficiencyLevelId = proficiency.Id, IsOffering = true, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Name = "JavaScript", Description = "Frontend development", CategoryId = category.Id, ProficiencyLevelId = proficiency.Id, IsOffering = true, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Name = "Python Programming", Description = "Data science and ML", CategoryId = category.Id, ProficiencyLevelId = proficiency.Id, IsOffering = true, CreatedAt = DateTime.UtcNow }
            };
            db.Skills.AddRange(skills);
            await db.SaveChangesAsync();
        });

        // Act
        var response = await Client.GetAsync("/api/skills/search?query=Programming&pageNumber=1&pageSize=10");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<PagedResponse<GetSkillResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data.Should().HaveCountGreaterThan(0);
        content.Data.Should().Contain(s => s.Name.Contains("Programming"));
    }

    [Fact]
    public async Task CreateSkillCategory_AsAdmin_ShouldSucceed()
    {
        // Arrange
        var request = new CreateSkillCategoryRequest
        {
            Name = _faker.Commerce.Categories(1)[0],
            Description = _faker.Lorem.Sentence(),
            IsActive = true
        };

        SetTestAuthenticationHeader(Guid.NewGuid().ToString(), new[] { "Admin" });

        // Act
        var response = await Client.PostAsJsonAsync("/api/skills/categories", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ApiResponse<SkillCategoryResponse>>();
        content.Should().NotBeNull();
        content!.IsSuccess.Should().BeTrue();
        content.Data.Should().NotBeNull();
        content.Data!.Name.Should().Be(request.Name);
    }

    [Fact]
    public async Task CreateSkillCategory_AsUser_ShouldReturnForbidden()
    {
        // Arrange
        var request = new CreateSkillCategoryRequest
        {
            Name = _faker.Commerce.Categories(1)[0],
            Description = _faker.Lorem.Sentence(),
            IsActive = true
        };

        SetTestAuthenticationHeader(Guid.NewGuid().ToString(), new[] { "User" });

        // Act
        var response = await Client.PostAsJsonAsync("/api/skills/categories", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<SkillCategory> SeedCategory()
    {
        return await ExecuteDbContextAsync(async db =>
        {
            var category = new SkillCategory
            {
                Id = Guid.NewGuid(),
                Name = _faker.Commerce.Categories(1)[0],
                Description = _faker.Lorem.Sentence(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.SkillCategories.Add(category);
            await db.SaveChangesAsync();
            return category;
        });
    }

    private async Task<ProficiencyLevel> SeedProficiencyLevel()
    {
        return await ExecuteDbContextAsync(async db =>
        {
            var proficiency = new ProficiencyLevel
            {
                Id = Guid.NewGuid(),
                Name = _faker.PickRandom("Beginner", "Intermediate", "Advanced", "Expert"),
                Level = _faker.Random.Int(1, 5),
                Description = _faker.Lorem.Sentence(),
                CreatedAt = DateTime.UtcNow
            };
            db.ProficiencyLevels.Add(proficiency);
            await db.SaveChangesAsync();
            return proficiency;
        });
    }
}