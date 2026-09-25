using Microsoft.AspNetCore.Mvc;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Api.Services;
using StackedHub.Domain;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/assistant")]
public class AssistantController : ControllerBase
{
    private readonly AssistantService _assistant;

    public AssistantController(AssistantService assistant)
    {
        _assistant = assistant;
    }

    [HttpPost]
    public async Task<ActionResult<AssistantResponse>> Ask(AssistantRequest request, CancellationToken cancellationToken)
    {
        int? customerId = null;
        if (User.Identity?.IsAuthenticated == true && User.IsInRole(nameof(UserRole.Customer)))
        {
            customerId = User.UserId();
        }

        var reply = await _assistant.AnswerAsync(request.Message, customerId, cancellationToken);
        return Ok(reply);
    }
}
