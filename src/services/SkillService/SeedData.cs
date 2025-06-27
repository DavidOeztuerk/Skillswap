using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;

namespace SkillService;

public class SeedData
{
    public static async Task SeedDefaultDataAsync(SkillDbContext context)
    {
        // Seed default skill categories if they don't exist
        if (!await context.SkillCategories.AnyAsync())
        {
            var defaultCategories = new[]
            {
            new SkillCategory
            {
                Name = "Programming",
                Description = "Software development and programming languages",
                IconName = "code",
                Color = "#007bff",
                SortOrder = 1,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Design",
                Description = "Graphic design, UI/UX, and creative skills",
                IconName = "palette",
                Color = "#dc3545",
                SortOrder = 2,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Marketing",
                Description = "Digital marketing, SEO, and social media",
                IconName = "megaphone",
                Color = "#28a745",
                SortOrder = 3,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Business",
                Description = "Business strategy, management, and entrepreneurship",
                IconName = "briefcase",
                Color = "#ffc107",
                SortOrder = 4,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Languages",
                Description = "Foreign languages and communication",
                IconName = "globe",
                Color = "#17a2b8",
                SortOrder = 5,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Music",
                Description = "Musical instruments and music production",
                IconName = "music",
                Color = "#6f42c1",
                SortOrder = 6,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Sports & Fitness",
                Description = "Physical activities and fitness training",
                IconName = "heart",
                Color = "#fd7e14",
                SortOrder = 7,
                IsActive = true,
                CreatedBy = "system"
            },
            new SkillCategory
            {
                Name = "Cooking",
                Description = "Culinary arts and cooking techniques",
                IconName = "chef-hat",
                Color = "#20c997",
                SortOrder = 8,
                IsActive = true,
                CreatedBy = "system"
            }
        };

            context.SkillCategories.AddRange(defaultCategories);
        }

        // Seed default proficiency levels if they don't exist
        if (!await context.ProficiencyLevels.AnyAsync())
        {
            var defaultLevels = new[]
            {
            new ProficiencyLevel
            {
                Level = "Beginner",
                Description = "Just starting out, basic knowledge",
                Rank = 1,
                Color = "#28a745",
                IsActive = true,
                MinExperienceMonths = 0,
                MaxExperienceMonths = 6,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Intermediate",
                Description = "Some experience, comfortable with basics",
                Rank = 2,
                Color = "#ffc107",
                IsActive = true,
                MinExperienceMonths = 6,
                MaxExperienceMonths = 24,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Advanced",
                Description = "Significant experience, can teach others",
                Rank = 3,
                Color = "#fd7e14",
                IsActive = true,
                MinExperienceMonths = 24,
                MaxExperienceMonths = 60,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Expert",
                Description = "Professional level, extensive experience",
                Rank = 4,
                Color = "#dc3545",
                IsActive = true,
                MinExperienceMonths = 60,
                MaxExperienceMonths = null,
                CreatedBy = "system"
            },
            new ProficiencyLevel
            {
                Level = "Master",
                Description = "Industry expert, thought leader",
                Rank = 5,
                Color = "#6f42c1",
                IsActive = true,
                MinExperienceMonths = 120,
                MaxExperienceMonths = null,
                RequiredSkillCount = 5,
                CreatedBy = "system"
            }
        };

            context.ProficiencyLevels.AddRange(defaultLevels);
        }

        await context.SaveChangesAsync();
    }
}
