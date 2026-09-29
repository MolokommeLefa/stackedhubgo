using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Api.Services;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize(Roles = $"{nameof(UserRole.Staff)},{nameof(UserRole.Admin)}")]
public class CustomersController : ControllerBase
{
    private readonly ReportService _reports;
    private readonly AppDbContext _db;

    public CustomersController(ReportService reports, AppDbContext db)
    {
        _reports = reports;
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> Get(CancellationToken cancellationToken) =>
        Ok(await _reports.Customers(cancellationToken));

    [HttpPatch("{id}")]
    public async Task<ActionResult<CustomerDto>> UpdateNote(string id, CustomerNoteRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var userId))
        {
            return NotFound(new { error = "Customer not found." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(
            x => x.Id == userId && x.Role == UserRole.Customer,
            cancellationToken);
        if (user is null)
        {
            return NotFound(new { error = "Customer not found." });
        }

        user.Note = request.Note?.Trim() ?? string.Empty;
        _db.AuditLogs.Add(new AuditLog
        {
            AdminId = User.RequireUserId(),
            Action = "Updated customer note",
            Entity = "User",
            EntityId = user.Id,
            Details = user.Name
        });
        await _db.SaveChangesAsync(cancellationToken);

        var orders = await _db.Orders.AsNoTracking()
            .Where(x => x.CustomerId == user.Id)
            .ToListAsync(cancellationToken);
        return Ok(user.ToCustomer(orders));
    }
}
