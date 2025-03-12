using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Contracts.Requests;
using Contracts.Responses;
using Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using SkillService;
using SkillService.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddServices(builder.Configuration);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var error = new { message = "Interner Serverfehler. Bitte später versuchen." };
        await context.Response.WriteAsJsonAsync(error);
    });
});

app.MapGet("/skills", async (
    SkillDbContext db,
    int page = 1,
    int pageSize = 10) =>
{
    var totalCount = await db.Skills.CountAsync();
    var skills = await db.Skills
        .Include(x => x.Category)
        .Include(x => x.ProficiencyLevel)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new
    {
        totalCount,
        page,
        pageSize,
        data = skills
    });
});

app.MapGet("/skills/{id}", async (
    string id,
    HttpContext context,
    SkillDbContext db) =>
{
    var skill = await db.Skills
        .Where(x => x.Id == id)
        .Include(x => x.Category)
        .Include(x => x.ProficiencyLevel)
        .FirstOrDefaultAsync();

    if (skill is null) return Results.NotFound();

    return Results.Ok(skill);
});

app.MapGet("/skills/search", async (
    SkillDbContext db,
    string query,
    int page = 1,
    int pageSize = 10) =>
{
    query ??= "";

    var totalCount = await db.Skills
        .Where(x => x.Name.Contains(query) || x.Description.Contains(query))
        .CountAsync();

    var skills = await db.Skills
        .Where(x => x.Name.Contains(query) || x.Description.Contains(query))
        .Include(x => x.Category)
        .Include(x => x.ProficiencyLevel)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new
    {
        totalCount,
        page,
        pageSize,
        data = skills
    });
});

app.MapGet("/user/skills", async (
    HttpContext context,
    SkillDbContext db,
    int page = 1,
    int pageSize = 10) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var totalCount = await db.Skills.CountAsync();
    var userSkills = await db.Skills
        .Where(x => x.UserId == userId)
        .Include(x => x.Category)
        .Include(x => x.ProficiencyLevel)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new
    {
        totalCount,
        page,
        pageSize,
        data = userSkills
    });
}).RequireAuthorization();

app.MapGet("/user/skills/{id}", async (
    HttpContext context,
    SkillDbContext db,
    string id) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var userSkills = await db.Skills
        .Where(x => x.Id == id && x.UserId == userId)
        .Include(x => x.Category)
        .Include(x => x.ProficiencyLevel)
        .ToListAsync();

    return Results.Ok(userSkills);
}).RequireAuthorization();

app.MapGet("/user/skills/search", async (
    HttpContext context,
    SkillDbContext db,
    string query,
    int page = 1,
    int pageSize = 10) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    query ??= "";

    var totalCount = await db.Skills
        .Where(x => x.Name.Contains(query) || x.Description.Contains(query))
        .CountAsync();

    var userSkills = await db.Skills
        .Where(x => x.UserId == userId && x.Name.Contains(query) || x.Description.Contains(query))
        .Include(x => x.Category)
        .Include(x => x.ProficiencyLevel)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new
    {
        totalCount,
        page,
        pageSize,
        data = userSkills
    });
}).RequireAuthorization();

app.MapPost("/skills", async (
    HttpContext context,
    SkillDbContext dbContext,
    IPublishEndpoint publisher,
    CreateSkillRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Name) ||
        request.Name.Length < 3)
    {
        return Results.BadRequest("Skill-Name muss mindestens 3 Zeichen lang sein.");
    }

    var categoryExists = await dbContext.SkillCategories.AnyAsync(c => c.Id == request.CategoryId);
    var proficiencyExists = await dbContext.ProficiencyLevels.AnyAsync(p => p.Id == request.ProficiencyLevelId);

    if (!categoryExists) return Results.BadRequest("Kategorie existiert nicht.");
    if (!proficiencyExists) return Results.BadRequest("Proficiency Level existiert nicht.");


    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = new Skill
    {
        UserId = userId,
        Name = request.Name,
        Description = request.Description,
        IsOffering = request.IsOffering,
        CategoryId = request.CategoryId,
        ProficiencyLevelId = request.ProficiencyLevelId
    };

    dbContext.Skills.Add(skill);
    await dbContext.SaveChangesAsync();

    await publisher.Publish(new SkillCreatedEvent(
        skill.Id, skill.Name, skill.Description, skill.IsOffering, userId));

    return Results.Created($"/skills/{skill.Id}", new CreateSkillResponse(skill.Id, skill.Name, skill.Description, skill.IsOffering, skill.CategoryId, skill.ProficiencyLevelId));
}).RequireAuthorization();

app.MapPut("/user/skills/{id}", async (
    string id,
    HttpContext context,
    SkillDbContext db,
    UpdateUserSkillRequest updateRequest) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = await db.Skills
        .Where(x => x.Id == id && x.UserId == userId)
        .FirstOrDefaultAsync();

    if (skill == null) return Results.NotFound("Skill nicht gefunden.");

    // Validierung
    if (string.IsNullOrWhiteSpace(updateRequest.Name) || updateRequest.Name.Length < 3)
        return Results.BadRequest("Skill-Name muss mindestens 3 Zeichen lang sein.");

    if (!await db.SkillCategories.AnyAsync(c => c.Id == updateRequest.CategoryId))
        return Results.BadRequest("Kategorie existiert nicht.");

    if (!await db.ProficiencyLevels.AnyAsync(p => p.Id == updateRequest.ProficiencyLevelId))
        return Results.BadRequest("Proficiency Level existiert nicht.");

    // Skill-Update
    skill.Name = updateRequest.Name;
    skill.Description = updateRequest.Description;
    skill.IsOffering = updateRequest.IsOffering;
    skill.CategoryId = updateRequest.CategoryId;
    skill.ProficiencyLevelId = updateRequest.ProficiencyLevelId;

    await db.SaveChangesAsync();

    return Results.Ok(new UpdateUserSkillResponse(
        skill.Id, skill.Name, skill.Description, skill.IsOffering, skill.CategoryId, skill.ProficiencyLevelId
    ));
}).RequireAuthorization();

app.MapDelete("/user/skills/{id}", async (
    string id,
    HttpContext context,
    SkillDbContext db) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = await db.Skills
        .Where(x => x.Id == id && x.UserId == userId)
        .FirstOrDefaultAsync();

    if (skill == null) return Results.NotFound("Skill nicht gefunden.");

    db.Skills.Remove(skill);
    await db.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization();


app.MapGet("/categories", async (SkillDbContext db) =>
    await db.SkillCategories.ToListAsync());

app.MapPost("/categories", async (
    SkillDbContext db,
    CreateCategoryRequest createCategoryRequest) =>
{
    if (string.IsNullOrEmpty(createCategoryRequest.Name) ||
        string.IsNullOrWhiteSpace(createCategoryRequest.Name))
    {
        return Results.BadRequest();
    }

    if (await db.SkillCategories.AnyAsync(c => c.Name == createCategoryRequest.Name))
    {
        return Results.Conflict("Kategorie existiert bereits.");
    }

    var category = new Category
    {
        Name = createCategoryRequest.Name
    };

    db.SkillCategories.Add(category);
    await db.SaveChangesAsync();

    return Results.Created($"/categories/{category.Id}",
        new CreateCategoryResponse(category.Id, category.Name)
    );
}).RequireAuthorization();

app.MapPut("/categories/{id}", async (
    string id,
    SkillDbContext db,
    UpdateCategoryRequest updatedCategoryRequest) =>
{
    if (string.IsNullOrEmpty(updatedCategoryRequest.Name) ||
        string.IsNullOrWhiteSpace(updatedCategoryRequest.Name))
    {
        return Results.BadRequest();
    }

    if (await db.SkillCategories.AnyAsync(c => c.Name == updatedCategoryRequest.Name))
    {
        return Results.Conflict("Kategorie existiert bereits.");
    }

    var category = await db.SkillCategories.FindAsync(id);
    if (category == null) return Results.NotFound();

    category.Name = updatedCategoryRequest.Name;
    await db.SaveChangesAsync();

    return Results.Ok(new UpdateCategoryResponse(category.Id, category.Name));
}).RequireAuthorization();

app.MapDelete("/categories/{id}", async (
    string id,
    SkillDbContext db) =>
{
    var category = await db.SkillCategories.FindAsync(id);
    if (category == null) return Results.NotFound();

    db.SkillCategories.Remove(category);
    await db.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization();

app.MapGet("/proficiencylevels", async (SkillDbContext db) =>
    await db.ProficiencyLevels.ToListAsync());

app.MapPost("/proficiencylevels", async (
    SkillDbContext db,
    CreateProficiencyLevelRequest createProfiencyLevelRequest) =>
{
    if (string.IsNullOrEmpty(createProfiencyLevelRequest.Level) ||
        string.IsNullOrWhiteSpace(createProfiencyLevelRequest.Level) ||
        createProfiencyLevelRequest.Rank <= 0)
    {
        return Results.BadRequest();
    }

    if (await db.ProficiencyLevels.AnyAsync(c => c.Level == createProfiencyLevelRequest.Level))
    {
        return Results.Conflict("ProficiencyLevel existiert bereits.");
    }

    var proficiencyLevel = new ProficiencyLevel
    {
        Level = createProfiencyLevelRequest.Level,
        Rank = createProfiencyLevelRequest.Rank
    };

    db.ProficiencyLevels.Add(proficiencyLevel);
    await db.SaveChangesAsync();

    return Results.Created($"/proficiencylevels/{proficiencyLevel.Id}",
        new CreateProficiencyLevelResponse(proficiencyLevel.Id, proficiencyLevel.Level, proficiencyLevel.Rank));
}).RequireAuthorization();

app.MapPut("/proficiencylevels/{id}", async (
    string id,
    SkillDbContext db,
    UpdateProficiencyLevelRequest updateProfiencyLevelRequest) =>
{
    if (string.IsNullOrEmpty(updateProfiencyLevelRequest.Level) ||
            string.IsNullOrWhiteSpace(updateProfiencyLevelRequest.Level) ||
            updateProfiencyLevelRequest.Rank <= 0)
    {
        return Results.BadRequest();
    }

    if (await db.ProficiencyLevels.AnyAsync(c => c.Level == updateProfiencyLevelRequest.Level))
    {
        return Results.Conflict("ProficiencyLevel existiert bereits.");
    }

    var proficiencyLevel = await db.ProficiencyLevels.FindAsync(id);
    if (proficiencyLevel == null) return Results.NotFound();

    proficiencyLevel.Level = updateProfiencyLevelRequest.Level;
    proficiencyLevel.Rank = updateProfiencyLevelRequest.Rank;
    await db.SaveChangesAsync();

    return Results.Ok(new UpdateProficiencyLevelResponse(proficiencyLevel.Id, proficiencyLevel.Level, proficiencyLevel.Rank));
}).RequireAuthorization();

app.MapDelete("/proficiencylevels/{id}", async (
    string id,
    SkillDbContext db) =>
{
    var proficiencyLevel = await db.ProficiencyLevels.FindAsync(id);
    if (proficiencyLevel == null) return Results.NotFound();

    db.ProficiencyLevels.Remove(proficiencyLevel);
    await db.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization();

app.Run();

static string? ExtractUserIdFromContext(HttpContext context)
{
    var userId =
        context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ??
        context.User.FindFirst("sub")?.Value ??
        context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    return userId;
}
