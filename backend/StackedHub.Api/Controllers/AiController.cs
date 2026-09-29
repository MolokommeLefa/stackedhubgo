using Microsoft.AspNetCore.Mvc;
using StackedHub.Api.Contracts;
using StackedHub.Api.Services;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly RecommendationService _recommendations;

    public AiController(RecommendationService recommendations)
    {
        _recommendations = recommendations;
    }

    [HttpPost("recommendations")]
    public async Task<ActionResult<List<AiSuggestion>>> Recommend(
        [FromBody] AiRecommendationRequest? request,
        CancellationToken cancellationToken)
    {
        var suggestions = await _recommendations.RecommendAsync(request?.Prompt, cancellationToken);
        return Ok(suggestions);
    }
}
