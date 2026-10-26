using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

public static class LoyaltyRules
{
    public const int RandPerPoint = 10;
    public const int RegularThreshold = 100;
    public const int VipThreshold = 400;
    public const string EarnRule = "Earn 1 point for every R10 on a completed order.";

    public static readonly LoyaltyRewardDefinition[] Rewards =
    [
        new("drink", "Free homemade lemonade", "A complimentary drink on your next visit.", 50),
        new("off30", "R30 off next order", "Recorded as a voucher for your next pickup.", 120),
        new("off80", "R80 off next order", "Recorded as a voucher for your next pickup.", 250)
    ];

    public static string Tier(int points) =>
        points >= VipThreshold ? "VIP" : points >= RegularThreshold ? "Regular" : "New";

    public static LoyaltyProgressDto? NextTier(int points)
    {
        if (points < RegularThreshold)
        {
            return new LoyaltyProgressDto("Regular", points, RegularThreshold, RegularThreshold - points);
        }

        if (points < VipThreshold)
        {
            return new LoyaltyProgressDto("VIP", points, VipThreshold, VipThreshold - points);
        }

        return null;
    }

    public static LoyaltyProgressDto? NextReward(int points)
    {
        var next = Rewards.FirstOrDefault(x => points < x.PointsCost);
        return next is null
            ? null
            : new LoyaltyProgressDto(next.Title, points, next.PointsCost, next.PointsCost - points);
    }
}

public record LoyaltyRewardDefinition(string Id, string Title, string Description, int PointsCost);

public class LoyaltyService
{
    private readonly AppDbContext _db;

    public LoyaltyService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<LoyaltyWalletDto> GetWallet(int customerId, CancellationToken cancellationToken)
    {
        var customer = await RequireCustomer(customerId, cancellationToken);
        return await BuildWallet(customer, cancellationToken);
    }

    public async Task<LoyaltyWalletDto> Redeem(int customerId, string rewardId, CancellationToken cancellationToken)
    {
        var reward = LoyaltyRules.Rewards.FirstOrDefault(x =>
            string.Equals(x.Id, rewardId, StringComparison.OrdinalIgnoreCase));
        if (reward is null)
        {
            throw new InvalidOperationException("That reward is not available.");
        }

        var customer = await RequireCustomer(customerId, cancellationToken);
        if (customer.LoyaltyPoints < reward.PointsCost)
        {
            throw new InvalidOperationException(
                $"You need {reward.PointsCost - customer.LoyaltyPoints} more points to redeem {reward.Title}.");
        }

        customer.LoyaltyPoints -= reward.PointsCost;
        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            CustomerId = customer.Id,
            Points = -reward.PointsCost,
            Type = "Redeem",
            Reason = reward.Title
        });
        await _db.SaveChangesAsync(cancellationToken);
        return await BuildWallet(customer, cancellationToken);
    }

    private async Task<LoyaltyWalletDto> BuildWallet(User customer, CancellationToken cancellationToken)
    {
        var history = await _db.LoyaltyTransactions
            .AsNoTracking()
            .Where(x => x.CustomerId == customer.Id)
            .OrderByDescending(x => x.At)
            .ThenByDescending(x => x.Id)
            .Take(50)
            .ToListAsync(cancellationToken);

        var rewards = LoyaltyRules.Rewards
            .Select(x => new LoyaltyRewardDto(
                x.Id,
                x.Title,
                x.Description,
                x.PointsCost,
                customer.LoyaltyPoints >= x.PointsCost))
            .ToList();

        return new LoyaltyWalletDto(
            customer.LoyaltyPoints,
            LoyaltyRules.Tier(customer.LoyaltyPoints),
            LoyaltyRules.EarnRule,
            LoyaltyRules.NextTier(customer.LoyaltyPoints),
            LoyaltyRules.NextReward(customer.LoyaltyPoints),
            rewards,
            history.Select(x => new LoyaltyTransactionDto(
                x.Id.ToString(),
                x.Points,
                x.Type,
                x.Reason,
                x.At,
                x.OrderId?.ToString())).ToList());
    }

    private async Task<User> RequireCustomer(int customerId, CancellationToken cancellationToken)
    {
        var customer = await _db.Users.FirstOrDefaultAsync(x => x.Id == customerId, cancellationToken)
            ?? throw new UnauthorizedAccessException();
        if (customer.Role != UserRole.Customer)
        {
            throw new UnauthorizedAccessException();
        }

        return customer;
    }
}
