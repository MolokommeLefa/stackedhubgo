using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/promotions")]
public class PromotionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PromotionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<PromotionDto>>> Get(CancellationToken cancellationToken)
    {
        var rows = await _db.Promotions.AsNoTracking().OrderByDescending(x => x.Active).ThenBy(x => x.Title)
            .ToListAsync(cancellationToken);
        return Ok(rows.Select(x => x.ToDto()));
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPost]
    public async Task<ActionResult<PromotionDto>> Create(UpsertPromotionRequest request, CancellationToken cancellationToken)
    {
        var promotion = new Promotion
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DiscountPercent = request.DiscountPercent,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            Active = request.Active
        };
        _db.Promotions.Add(promotion);
        await _db.SaveChangesAsync(cancellationToken);
        _db.AuditLogs.Add(new AuditLog
        {
            AdminId = User.RequireUserId(),
            Action = "Created promotion",
            Entity = "Promotion",
            EntityId = promotion.Id,
            Details = promotion.Title
        });
        await _db.SaveChangesAsync(cancellationToken);
        return Created($"/api/promotions/{promotion.Id}", promotion.ToDto());
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPatch("{id}")]
    public async Task<ActionResult<PromotionDto>> Toggle(string id, [FromBody] ActivateFlag? body, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var promoId))
        {
            return NotFound(new { error = "Promotion not found." });
        }

        var promotion = await _db.Promotions.FirstOrDefaultAsync(x => x.Id == promoId, cancellationToken);
        if (promotion is null)
        {
            return NotFound(new { error = "Promotion not found." });
        }

        promotion.Active = body?.Active ?? !promotion.Active;
        _db.AuditLogs.Add(new AuditLog
        {
            AdminId = User.RequireUserId(),
            Action = "Updated promotion",
            Entity = "Promotion",
            EntityId = promotion.Id,
            Details = promotion.Title
        });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(promotion.ToDto());
    }

    public record ActivateFlag(bool? Active);
}
