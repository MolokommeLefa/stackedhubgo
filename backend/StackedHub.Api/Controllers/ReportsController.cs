using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackedHub.Api.Contracts;
using StackedHub.Api.Services;
using StackedHub.Domain;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reports;

    public ReportsController(ReportService reports)
    {
        _reports = reports;
    }

    [HttpGet]
    public async Task<ActionResult<ReportDto>> Get(CancellationToken cancellationToken) =>
        Ok(await _reports.Build(cancellationToken));
}
