using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditLogsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<AuditLogDto>>> Get(CancellationToken cancellationToken)
    {
        var rows = await _db.AuditLogs.AsNoTracking()
            .Include(x => x.Admin)
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);
        return Ok(rows.Select(x => x.ToDto()));
    }
}
