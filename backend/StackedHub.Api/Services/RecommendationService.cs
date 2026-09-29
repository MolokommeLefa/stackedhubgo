using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

public class RecommendationService
{
    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        AppDbContext db,
        HttpClient http,
        IConfiguration configuration,
        ILogger<RecommendationService> logger)
    {
        _db = db;
        _http = http;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<List<AiSuggestion>> RecommendAsync(string? prompt, CancellationToken cancellationToken)
    {
        var menu = await _db.MenuItems.AsNoTracking()
            .Where(x => x.Available && x.Stock > 0)
            .ToListAsync(cancellationToken);
        var grounded = Grounded(prompt, menu);

        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return grounded;
        }

        try
        {
            var fromGemini = await AskGeminiAsync(apiKey, prompt, menu, cancellationToken);
            if (fromGemini.Count > 0)
            {
                return fromGemini;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini recommendation failed; using menu-grounded fallback.");
        }

        return grounded;
    }

    private static List<AiSuggestion> Grounded(string? prompt, IReadOnlyCollection<Domain.MenuItem> menu)
    {
        var p = (prompt ?? string.Empty).ToLowerInvariant();
        IEnumerable<Domain.MenuItem> picks = menu;

        if (Contains(p, "spic", "hot", "chilli", "peri"))
        {
            picks = menu.Where(x => x.Spicy);
        }
        else if (Contains(p, "sweet", "dessert", "pudding", "koeksister"))
        {
            picks = menu.Where(x => x.Category == Domain.MenuCategory.Desserts);
        }
        else if (Contains(p, "light", "veg", "healthy", "drink"))
        {
            picks = menu.Where(x => x.Category != Domain.MenuCategory.Mains);
        }
        else if (Contains(p, "cheap", "budget", "under"))
        {
            picks = menu.OrderBy(x => x.Price);
        }

        var selected = picks.Take(3).ToList();
        if (selected.Count == 0)
        {
            selected = menu.Take(3).ToList();
        }

        return selected.Select(item => new AiSuggestion(
            item.Name,
            $"{item.Description} (R{item.Price:0})",
            item.Id.ToString())).ToList();
    }

    private async Task<List<AiSuggestion>> AskGeminiAsync(
        string apiKey,
        string? prompt,
        IReadOnlyCollection<Domain.MenuItem> menu,
        CancellationToken cancellationToken)
    {
        var model = _configuration["Gemini:Model"] ?? "gemini-2.0-flash";
        var catalogue = string.Join("\n", menu.Select(item =>
            $"- {item.Name} | {item.Category} | R{item.Price:0} | spicy={item.Spicy} | {item.Description}"));
        var userPrompt = string.IsNullOrWhiteSpace(prompt) ? "Recommend three pickup items." : prompt.Trim();
        var body = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new
                        {
                            text =
                                "You are StackedHub's menu assistant for Stacked Foods (South Africa). " +
                                "Recommend exactly 3 items from THIS menu only. " +
                                "Reply with a JSON array of objects with keys name and reason. No markdown.\n\n" +
                                $"Menu:\n{catalogue}\n\nCustomer prompt: {userPrompt}"
                        }
                    }
                }
            },
            generationConfig = new { temperature = 0.3, maxOutputTokens = 400 }
        };

        using var response = await _http.PostAsJsonAsync(
            $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={Uri.EscapeDataString(apiKey)}",
            body,
            cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Gemini HTTP {Status}", (int)response.StatusCode);
            return [];
        }

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        if (!document.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            return [];
        }

        var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? string.Empty;
        var json = ExtractJsonArray(text);
        if (json is null)
        {
            return [];
        }

        using var parsed = JsonDocument.Parse(json);
        var suggestions = new List<AiSuggestion>();
        foreach (var row in parsed.RootElement.EnumerateArray())
        {
            var name = row.TryGetProperty("name", out var nameEl) ? nameEl.GetString() : null;
            var reason = row.TryGetProperty("reason", out var reasonEl) ? reasonEl.GetString() : null;
            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            var match = menu.FirstOrDefault(x => x.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                ?? menu.FirstOrDefault(x => name.Contains(x.Name, StringComparison.OrdinalIgnoreCase) || x.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
            if (match is null)
            {
                continue;
            }

            suggestions.Add(new AiSuggestion(match.Name, string.IsNullOrWhiteSpace(reason) ? match.Description : reason!, match.Id.ToString()));
        }

        return suggestions.Take(3).ToList();
    }

    private static string? ExtractJsonArray(string text)
    {
        var start = text.IndexOf('[');
        var end = text.LastIndexOf(']');
        if (start < 0 || end <= start)
        {
            return null;
        }

        return text[start..(end + 1)];
    }

    private static bool Contains(string haystack, params string[] needles) =>
        needles.Any(haystack.Contains);
}
