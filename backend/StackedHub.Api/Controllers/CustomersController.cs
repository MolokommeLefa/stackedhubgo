using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackedHub.Api.Contracts;
using StackedHub.Api.Services;
using StackedHub.Domain;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize(Roles = $"{nameof(UserRole.Staff)},{nameof(UserRole.Admin)}")]
public class CustomersController : ControllerBase
{
    private readonly ReportService _reports;

    public CustomersController(ReportService reports)
    {
        _reports = reports;
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> Get(CancellationToken cancellationToken) =>
        Ok(await _reports.Customers(cancellationToken));
}
