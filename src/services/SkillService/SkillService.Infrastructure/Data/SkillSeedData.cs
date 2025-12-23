using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;

namespace SkillService.Infrastructure.Data;

/// <summary>
/// Seeds initial skill-related data including categories and proficiency levels
/// </summary>
public static class SkillSeedData
{
    public static async Task SeedAsync(SkillDbContext context)
    {
        // Seed Skill Categories
        await SeedSkillCategoriesAsync(context);
        await context.SaveChangesAsync();

        // Seed Proficiency Levels
        await SeedProficiencyLevelsAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedSkillCategoriesAsync(SkillDbContext context)
    {
        var categories = new List<(string Name, string Description, string IconName, string Color, string Slug)>
        {
            // Technology & Programming
            ("Programming", "Software development and coding skills", "code", "#007ACC", "programming"),
            ("Web Development", "Frontend and backend web technologies", "web", "#61DAFB", "web-development"),
            ("Mobile Development", "iOS, Android, and cross-platform mobile apps", "smartphone", "#3DDC84", "mobile-development"),
            ("Data Science", "Data analysis, machine learning, and AI", "analytics", "#FF6F00", "data-science"),
            ("Cloud & DevOps", "Cloud platforms and DevOps practices", "cloud", "#FF9900", "cloud-devops"),
            ("Cybersecurity", "Security, penetration testing, and compliance", "security", "#00C853", "cybersecurity"),
            ("Database", "SQL, NoSQL, and database administration", "storage", "#336791", "database"),
            
            // Design & Creative
            ("UI/UX Design", "User interface and experience design", "palette", "#FF4081", "ui-ux-design"),
            ("Graphic Design", "Visual design and branding", "brush", "#E91E63", "graphic-design"),
            ("Video Production", "Video editing and production", "videocam", "#FF5722", "video-production"),
            ("Photography", "Photography and photo editing", "camera_alt", "#9C27B0", "photography"),
            ("3D & Animation", "3D modeling and animation", "view_in_ar", "#673AB7", "3d-animation"),
            
            // Business & Management
            ("Project Management", "Agile, Scrum, and project coordination", "assignment", "#4CAF50", "project-management"),
            ("Marketing", "Digital marketing and growth strategies", "campaign", "#2196F3", "marketing"),
            ("Sales", "Sales techniques and customer relations", "trending_up", "#00BCD4", "sales"),
            ("Finance", "Financial analysis and accounting", "account_balance", "#009688", "finance"),
            ("Business Strategy", "Strategic planning and business development", "business_center", "#795548", "business-strategy"),
            
            // Languages & Communication
            ("English", "English language teaching and tutoring", "translate", "#F44336", "english"),
            ("Spanish", "Spanish language teaching and tutoring", "language", "#FF9800", "spanish"),
            ("French", "French language teaching and tutoring", "language", "#3F51B5", "french"),
            ("German", "German language teaching and tutoring", "language", "#FFEB3B", "german"),
            ("Mandarin", "Mandarin Chinese teaching and tutoring", "language", "#F44336", "mandarin"),
            ("Writing", "Content writing and copywriting", "edit", "#607D8B", "writing"),
            ("Public Speaking", "Presentation and communication skills", "mic", "#9E9E9E", "public-speaking"),
            
            // Music & Arts
            ("Music Production", "Music composition and production", "music_note", "#4CAF50", "music-production"),
            ("Instruments", "Musical instrument instruction", "piano", "#FF5722", "instruments"),
            ("Singing", "Vocal training and singing lessons", "mic_external_on", "#E91E63", "singing"),
            ("Dance", "Dance instruction and choreography", "directions_walk", "#9C27B0", "dance"),
            ("Acting", "Acting and theater performance", "theater_comedy", "#673AB7", "acting"),
            
            // Health & Fitness
            ("Fitness Training", "Personal training and workout planning", "fitness_center", "#FF6F00", "fitness-training"),
            ("Yoga", "Yoga instruction and meditation", "self_improvement", "#4CAF50", "yoga"),
            ("Nutrition", "Diet planning and nutritional advice", "restaurant", "#8BC34A", "nutrition"),
            ("Mental Health", "Counseling and mental wellness", "psychology", "#00ACC1", "mental-health"),
            ("Sports Coaching", "Sports training and coaching", "sports", "#FF5722", "sports-coaching"),
            
            // Academic & Education
            ("Mathematics", "Math tutoring from basic to advanced", "calculate", "#2196F3", "mathematics"),
            ("Science", "Physics, Chemistry, Biology tutoring", "science", "#4CAF50", "science"),
            ("History", "History and social studies tutoring", "history_edu", "#795548", "history"),
            ("Test Preparation", "SAT, GRE, GMAT, and other test prep", "school", "#FF9800", "test-preparation"),
            ("Academic Writing", "Research papers and thesis writing", "description", "#607D8B", "academic-writing"),
            
            // Life Skills & Hobbies
            ("Cooking", "Culinary skills and recipe development", "restaurant_menu", "#FF5722", "cooking"),
            ("Gardening", "Gardening and landscaping", "local_florist", "#4CAF50", "gardening"),
            ("Home Improvement", "DIY and home renovation skills", "home_repair_service", "#795548", "home-improvement"),
            ("Fashion", "Fashion design and styling", "checkroom", "#E91E63", "fashion"),
            ("Gaming", "Video game coaching and strategy", "sports_esports", "#9C27B0", "gaming"),
            ("Chess", "Chess strategy and training", "psychology", "#424242", "chess"),
            
            // Professional Services
            ("Legal", "Legal advice and document preparation", "gavel", "#37474F", "legal"),
            ("Real Estate", "Real estate investment and property management", "home", "#795548", "real-estate"),
            ("Consulting", "Business and management consulting", "support_agent", "#3F51B5", "consulting"),
            ("Career Coaching", "Career development and job search assistance", "work", "#009688", "career-coaching")
        };

        foreach (var (name, description, iconName, color, slug) in categories)
        {
            var exists = await context.SkillCategories.AnyAsync(c => c.Name == name);
            if (!exists)
            {
                context.SkillCategories.Add(new SkillCategory
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = name,
                    Description = description,
                    IconName = iconName,
                    Color = color,
                    Slug = slug,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
    }

    private static async Task SeedProficiencyLevelsAsync(SkillDbContext context)
    {
        var levels = new List<(string Level, string Description, int Rank, string Color)>
        {
            ("Beginner", 
             "Just starting to learn this skill. Can handle basic tasks with guidance.", 
             1, "#4CAF50"),
            
            ("Elementary", 
             "Have basic knowledge and can perform simple tasks independently.", 
             2, "#8BC34A"),
            
            ("Intermediate", 
             "Comfortable with common tasks and can handle moderate complexity.", 
             3, "#FFC107"),
            
            ("Advanced", 
             "Strong expertise, can handle complex tasks and teach others.", 
             4, "#FF9800"),
            
            ("Expert", 
             "Master level expertise with deep knowledge and extensive experience.", 
             5, "#F44336"),
            
            ("Professional", 
             "Industry professional with proven track record and certifications.", 
             6, "#9C27B0")
        };

        foreach (var (level, description, rank, color) in levels)
        {
            var exists = await context.ProficiencyLevels.AnyAsync(p => p.Level == level);
            if (!exists)
            {
                context.ProficiencyLevels.Add(new ProficiencyLevel
                {
                    Id = Guid.NewGuid().ToString(),
                    Level = level,
                    Description = description,
                    Rank = rank,
                    Color = color,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
    }

    // /// <summary>
    // /// Seeds sample skills for testing (optional - call only in development)
    // /// </summary>
    // public static async Task SeedSampleSkillsAsync(SkillDbContext context, string? testUserId = null)
    // {
    //     if (string.IsNullOrEmpty(testUserId))
    //         return;

    //     // Get some categories and levels for sample data
    //     var programmingCategory = await context.SkillCategories
    //         .FirstOrDefaultAsync(c => c.Name == "Programming");
        
    //     var webDevCategory = await context.SkillCategories
    //         .FirstOrDefaultAsync(c => c.Name == "Web Development");
        
    //     var intermediateLevel = await context.ProficiencyLevels
    //         .FirstOrDefaultAsync(p => p.Level == "Intermediate");
        
    //     var advancedLevel = await context.ProficiencyLevels
    //         .FirstOrDefaultAsync(p => p.Level == "Advanced");

    //     if (programmingCategory == null || webDevCategory == null || 
    //         intermediateLevel == null || advancedLevel == null)
    //         return;

    //     var sampleSkills = new List<(string Name, string Description, string CategoryId, string LevelId, string Requirements)>
    //     {
    //         ("C# Programming", 
    //          "Experienced in C# development including .NET Core, ASP.NET, and Entity Framework", 
    //          programmingCategory.Id, 
    //          advancedLevel.Id,
    //          "Basic understanding of object-oriented programming"),
            
    //         ("React Development", 
    //          "Building modern web applications with React, Redux, and TypeScript", 
    //          webDevCategory.Id, 
    //          intermediateLevel.Id,
    //          "HTML, CSS, JavaScript fundamentals")
    //     };

    //     foreach (var (name, description, categoryId, levelId, requirements) in sampleSkills)
    //     {
    //         var exists = await context.Skills
    //             .AnyAsync(s => s.UserId == testUserId && s.Name == name);
            
    //         if (!exists)
    //         {
    //             context.Skills.Add(new Skill
    //             {
    //                 Id = Guid.NewGuid().ToString(),
    //                 UserId = testUserId,
    //                 Name = name,
    //                 Description = description,
    //                 SkillCategoryId = categoryId,
    //                 ProficiencyLevelId = levelId,
    //                 Requirements = requirements,
    //                 IsActive = true,
    //                 IsVerified = false,
    //                 AverageRating = 0,
    //                 TotalReviews = 0,
    //                 CreatedAt = DateTime.UtcNow
    //             });
    //         }
    //     }

    //     await context.SaveChangesAsync();
    // }
}