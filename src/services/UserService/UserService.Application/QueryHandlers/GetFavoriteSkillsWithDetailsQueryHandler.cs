using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Text.Json;
using UserService.Application.Queries;
using UserService.Domain.Repositories;
using Contracts.User.Responses;

namespace UserService.Application.QueryHandlers;

/// <summary>
/// Handler that fetches favorite skill IDs from UserService and then retrieves full details from SkillService
/// </summary>
public class GetFavoriteSkillsWithDetailsQueryHandler : BasePagedQueryHandler<GetFavoriteSkillsWithDetailsQuery, FavoriteSkillDetailResponse>
{
    private readonly IUserSkillsRepository _userSkillsRepository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GetFavoriteSkillsWithDetailsQueryHandler> _logger;

    public GetFavoriteSkillsWithDetailsQueryHandler(
        IUserSkillsRepository userSkillsRepository,
        IHttpClientFactory httpClientFactory,
        ILogger<GetFavoriteSkillsWithDetailsQueryHandler> logger) : base(logger)
    {
        _userSkillsRepository = userSkillsRepository;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public override async Task<PagedResponse<FavoriteSkillDetailResponse>> Handle(
        GetFavoriteSkillsWithDetailsQuery request,
        CancellationToken cancellationToken)
    {
        // Step 1: Get favorite skill IDs from UserService database
        var favoriteSkillIds = await _userSkillsRepository.GetFavoriteSkills(
            request.UserId,
            cancellationToken);

        if (!favoriteSkillIds.Any())
        {
            return Success(
                new List<FavoriteSkillDetailResponse>(),
                request.PageNumber,
                request.PageSize,
                0);
        }

        // Step 2: Apply pagination to skill IDs
        var totalCount = favoriteSkillIds.Count;
        var paginatedSkillIds = favoriteSkillIds
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        // Step 3: Fetch skill details from SkillService
        var skillDetails = new List<FavoriteSkillDetailResponse>();
        var httpClient = _httpClientFactory.CreateClient("SkillService");

        // Batch fetch skills to reduce HTTP calls
        var tasks = paginatedSkillIds.Select(async skillId =>
        {
            try
            {
                var response = await httpClient.GetAsync($"/skills/{skillId}", cancellationToken);
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync(cancellationToken);
                    var apiResponse = JsonSerializer.Deserialize<ApiResponse<SkillDetailDto>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (apiResponse?.Data != null)
                    {
                        return MapToFavoriteSkillDetail(apiResponse.Data, skillId);
                    }
                }
                else
                {
                    _logger.LogWarning("Failed to fetch skill {SkillId} from SkillService. Status: {StatusCode}",
                        skillId, response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching skill {SkillId} from SkillService", skillId);
            }

            // Return a placeholder for failed fetches
            return new FavoriteSkillDetailResponse
            {
                SkillId = skillId,
                Name = "Skill nicht verfügbar",
                Description = "Details konnten nicht geladen werden",
                Category = "Unbekannt",
                AddedToFavoritesAt = DateTime.UtcNow
            };
        });

        skillDetails = (await Task.WhenAll(tasks)).ToList();

        return Success(
            skillDetails,
            request.PageNumber,
            request.PageSize,
            totalCount);
    }

    private FavoriteSkillDetailResponse MapToFavoriteSkillDetail(SkillDetailDto skill, string skillId)
    {
        return new FavoriteSkillDetailResponse
        {
            SkillId = skillId,
            Name = skill.Name ?? "Unbekannt",
            Description = skill.Description ?? string.Empty,
            Category = skill.Category ?? "Allgemein",
            ProficiencyLevel = skill.ProficiencyLevel ?? "Anfänger",
            IsOffered = skill.IsOffered,
            Price = skill.Price,
            Currency = skill.Currency,
            Rating = skill.AverageRating,
            ReviewCount = skill.ReviewCount,
            MatchCount = skill.MatchCount,
            Tags = skill.Tags ?? new List<string>(),
            ThumbnailUrl = skill.ThumbnailUrl,
            OwnerId = skill.UserId ?? string.Empty,
            OwnerName = skill.UserName ?? "Unbekannter Benutzer",
            OwnerAvatarUrl = skill.UserAvatarUrl,
            AddedToFavoritesAt = DateTime.UtcNow // This should come from user's favorite record
        };
    }

    // DTO for deserializing SkillService response
    private class SkillDetailDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public string? ProficiencyLevel { get; set; }
        public bool IsOffered { get; set; }
        public decimal? Price { get; set; }
        public string? Currency { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public int MatchCount { get; set; }
        public List<string>? Tags { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserAvatarUrl { get; set; }
    }
}