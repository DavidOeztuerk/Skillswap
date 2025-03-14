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

// Globaler Exception-Handler
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

// --------------------------------------------------
// Public Skill Routes
// --------------------------------------------------
app.MapGet("/skills", async (SkillDbContext db, int page = 1, int pageSize = 10) =>
{
    var totalCount = await db.Skills.CountAsync();
    var skills = await db.Skills
        .Include(x => x.SkillCategory)
        .Include(x => x.ProficiencyLevel)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(s => new SkillResponse(
            s.Id,
            s.UserId,
            s.Name,
            s.Description,
            s.IsOffering,
            s.SkillCategoryId,
            s.ProficiencyLevelId
        ))
        .ToListAsync();

    return Results.Ok(new { totalCount, page, pageSize, data = skills });
});

app.MapGet("/skills/{id}", async (string id, SkillDbContext db) =>
{
    var skill = await db.Skills
        .Include(x => x.SkillCategory)
        .Include(x => x.ProficiencyLevel)
        .FirstOrDefaultAsync(x => x.Id == id);

    if (skill is null) return Results.NotFound();

    var response = new SkillResponse(
        skill.Id,
        skill.UserId,
        skill.Name,
        skill.Description,
        skill.IsOffering,
        skill.SkillCategoryId,
        skill.ProficiencyLevelId
    );
    return Results.Ok(response);
});

app.MapGet("/skills/search", async (SkillDbContext db, string? query, int page = 1, int pageSize = 10) =>
{
    query ??= "";
    var baseQuery = db.Skills
        .Include(x => x.SkillCategory)
        .Include(x => x.ProficiencyLevel)
        .Where(x => x.Name.Contains(query) || x.Description.Contains(query));

    var totalCount = await baseQuery.CountAsync();
    var skills = await baseQuery
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(s => new SkillResponse(
            s.Id,
            s.UserId,
            s.Name,
            s.Description,
            s.IsOffering,
            s.SkillCategoryId,
            s.ProficiencyLevelId
        ))
        .ToListAsync();

    return Results.Ok(new { totalCount, page, pageSize, data = skills });
});

// --------------------------------------------------
// User Skill Routes
// --------------------------------------------------
app.MapGet("/user/skills", async (HttpContext context, SkillDbContext db, int page = 1, int pageSize = 10) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var baseQuery = db.Skills
        .Where(x => x.UserId == userId)
        .Include(x => x.SkillCategory)
        .Include(x => x.ProficiencyLevel);

    var totalCount = await baseQuery.CountAsync();
    var userSkills = await baseQuery
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(s => new SkillResponse(
            s.Id,
            s.UserId,
            s.Name,
            s.Description,
            s.IsOffering,
            s.SkillCategoryId,
            s.ProficiencyLevelId
        ))
        .ToListAsync();

    return Results.Ok(new { totalCount, page, pageSize, data = userSkills });
}).RequireAuthorization();

app.MapGet("/user/skills/{id}", async (HttpContext context, SkillDbContext db, string id) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = await db.Skills
        .Where(x => x.Id == id && x.UserId == userId)
        .Include(x => x.SkillCategory)
        .Include(x => x.ProficiencyLevel)
        .FirstOrDefaultAsync();

    if (skill == null) return Results.NotFound();

    var response = new SkillResponse(
        skill.Id,
        skill.UserId,
        skill.Name,
        skill.Description,
        skill.IsOffering,
        skill.SkillCategoryId,
        skill.ProficiencyLevelId
    );
    return Results.Ok(response);
}).RequireAuthorization();

app.MapGet("/user/skills/search", async (HttpContext context, SkillDbContext db, string? query, int page = 1, int pageSize = 10) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    query ??= "";
    var baseQuery = db.Skills
        .Where(x => x.UserId == userId && (x.Name.Contains(query) || x.Description.Contains(query)))
        .Include(x => x.SkillCategory)
        .Include(x => x.ProficiencyLevel);

    var totalCount = await baseQuery.CountAsync();
    var userSkills = await baseQuery
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(s => new SkillResponse(
            s.Id,
            s.UserId,
            s.Name,
            s.Description,
            s.IsOffering,
            s.SkillCategoryId,
            s.ProficiencyLevelId
        ))
        .ToListAsync();

    return Results.Ok(new { totalCount, page, pageSize, data = userSkills });
}).RequireAuthorization();

// --------------------------------------------------
// Create Skill
// --------------------------------------------------
app.MapPost("/skills", async (
    HttpContext context,
    SkillDbContext db,
    IPublishEndpoint publisher,
    CreateSkillRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length < 3)
        return Results.BadRequest("Skill-Name muss mindestens 3 Zeichen lang sein.");

    if (!await db.SkillCategories.AnyAsync(c => c.Id == request.SkillCategoryId))
        return Results.BadRequest("Kategorie existiert nicht.");

    if (!await db.ProficiencyLevels.AnyAsync(p => p.Id == request.ProficiencyLevelId))
        return Results.BadRequest("Proficiency Level existiert nicht.");

    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = new Skill
    {
        UserId = userId,
        Name = request.Name,
        Description = request.Description,
        IsOffering = request.IsOffering,
        SkillCategoryId = request.SkillCategoryId,
        ProficiencyLevelId = request.ProficiencyLevelId
    };

    db.Skills.Add(skill);
    await db.SaveChangesAsync();

    await publisher.Publish(new SkillCreatedEvent(skill.Id, skill.Name, skill.Description, skill.IsOffering, userId));

    var response = new SkillResponse(
        skill.Id,
        skill.UserId,
        skill.Name,
        skill.Description,
        skill.IsOffering,
        skill.SkillCategoryId,
        skill.ProficiencyLevelId
    );
    return Results.Created($"/skills/{skill.Id}", response);
}).RequireAuthorization();

// --------------------------------------------------
// Update Skill
// --------------------------------------------------
app.MapPut("/user/skills/{id}", async (string id, HttpContext context, SkillDbContext db, UpdateSkillRequest updateRequest) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = await db.Skills.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
    if (skill == null) return Results.NotFound("Skill nicht gefunden.");

    if (string.IsNullOrWhiteSpace(updateRequest.Name) || updateRequest.Name.Length < 3)
        return Results.BadRequest("Skill-Name muss mindestens 3 Zeichen lang sein.");

    if (!await db.SkillCategories.AnyAsync(c => c.Id == updateRequest.SkillCategoryId))
        return Results.BadRequest("Kategorie existiert nicht.");

    if (!await db.ProficiencyLevels.AnyAsync(p => p.Id == updateRequest.ProficiencyLevelId))
        return Results.BadRequest("Proficiency Level existiert nicht.");

    skill.Name = updateRequest.Name;
    skill.Description = updateRequest.Description;
    skill.IsOffering = updateRequest.IsOffering;
    skill.SkillCategoryId = updateRequest.SkillCategoryId;
    skill.ProficiencyLevelId = updateRequest.ProficiencyLevelId;
    await db.SaveChangesAsync();

    return Results.Ok(new UpdateUserSkillResponse(
        skill.Id,
        skill.Name,
        skill.Description,
        skill.IsOffering,
        skill.SkillCategoryId,
        skill.ProficiencyLevelId
    ));
}).RequireAuthorization();

// --------------------------------------------------
// Delete Skill
// --------------------------------------------------
app.MapDelete("/user/skills/{id}", async (string id, HttpContext context, SkillDbContext db) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = await db.Skills.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
    if (skill == null) return Results.NotFound("Skill nicht gefunden.");

    db.Skills.Remove(skill);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// --------------------------------------------------
// Categories
// --------------------------------------------------
app.MapGet("/categories", async (SkillDbContext db) =>
{
    var categories = await db.SkillCategories
        .Select(c => new CategoryResponse(c.Id, c.Name))
        .ToListAsync();

    return Results.Ok(categories);
});

app.MapPost("/categories", async (SkillDbContext db, CreateCategoryRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
        return Results.BadRequest();

    if (await db.SkillCategories.AnyAsync(c => c.Name == request.Name))
        return Results.Conflict("Kategorie existiert bereits.");

    var category = new SkillCategory { Name = request.Name };
    db.SkillCategories.Add(category);
    await db.SaveChangesAsync();

    return Results.Created($"/categories/{category.Id}", new CategoryResponse(category.Id, category.Name));
}).RequireAuthorization();

app.MapPut("/categories/{id}", async (string id, SkillDbContext db, UpdateCategoryRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
        return Results.BadRequest();

    if (await db.SkillCategories.AnyAsync(c => c.Name == request.Name))
        return Results.Conflict("Kategorie existiert bereits.");

    var category = await db.SkillCategories.FindAsync(id);
    if (category == null) return Results.NotFound();

    category.Name = request.Name;
    await db.SaveChangesAsync();

    return Results.Ok(new UpdateCategoryResponse(category.Id, category.Name));
}).RequireAuthorization();

app.MapDelete("/categories/{id}", async (string id, SkillDbContext db) =>
{
    var category = await db.SkillCategories.FindAsync(id);
    if (category == null) return Results.NotFound();

    db.SkillCategories.Remove(category);
    await db.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization();

// --------------------------------------------------
// ProficiencyLevels
// --------------------------------------------------
app.MapGet("/proficiencylevels", async (SkillDbContext db) =>
{
    return await db.ProficiencyLevels
        .Select(p => new ProficiencyLevelResponse(p.Id, p.Level, p.Rank))
        .ToListAsync();
});

app.MapPost("/proficiencylevels", async (SkillDbContext db, CreateProficiencyLevelRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Level) || request.Rank <= 0)
        return Results.BadRequest();

    if (await db.ProficiencyLevels.AnyAsync(c => c.Level == request.Level))
        return Results.Conflict("ProficiencyLevel existiert bereits.");

    var proficiencyLevel = new ProficiencyLevel
    {
        Level = request.Level,
        Rank = request.Rank
    };

    db.ProficiencyLevels.Add(proficiencyLevel);
    await db.SaveChangesAsync();

    return Results.Created(
        $"/proficiencylevels/{proficiencyLevel.Id}",
        new ProficiencyLevelResponse(proficiencyLevel.Id, proficiencyLevel.Level, proficiencyLevel.Rank)
    );
}).RequireAuthorization();

app.MapPut("/proficiencylevels/{id}", async (string id, SkillDbContext db, UpdateProficiencyLevelRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Level) || request.Rank <= 0)
        return Results.BadRequest();

    if (await db.ProficiencyLevels.AnyAsync(c => c.Level == request.Level))
        return Results.Conflict("ProficiencyLevel existiert bereits.");

    var proficiencyLevel = await db.ProficiencyLevels.FindAsync(id);
    if (proficiencyLevel == null) return Results.NotFound();

    proficiencyLevel.Level = request.Level;
    proficiencyLevel.Rank = request.Rank;
    await db.SaveChangesAsync();

    return Results.Ok(new UpdateProficiencyLevelResponse(proficiencyLevel.Id, proficiencyLevel.Level, proficiencyLevel.Rank));
}).RequireAuthorization();

app.MapDelete("/proficiencylevels/{id}", async (string id, SkillDbContext db) =>
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
    return context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
        ?? context.User.FindFirst("sub")?.Value
        ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
