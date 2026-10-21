using Microsoft.EntityFrameworkCore;
using StackedHub.Domain;

namespace StackedHub.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusEvent> OrderStatusEvents => Set<OrderStatusEvent>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();
    public DbSet<GroupBasket> GroupBaskets => Set<GroupBasket>();
    public DbSet<GroupBasketParticipant> GroupBasketParticipants => Set<GroupBasketParticipant>();
    public DbSet<GroupBasketItem> GroupBasketItems => Set<GroupBasketItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Promotion> Promotions => Set<Promotion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(200).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            entity.Property(x => x.FirstName).HasMaxLength(80).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(80).IsRequired();
            entity.Property(x => x.PhoneNumber).HasMaxLength(40);
            entity.Property(x => x.Note).HasMaxLength(400);
            entity.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
            entity.Ignore(x => x.Name);
        });

        modelBuilder.Entity<MenuItem>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Category).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Price).HasPrecision(10, 2);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(x => x.Reference).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Status).HasConversion(
                v => ChannelLabels.FromStatus(v),
                v => ChannelLabels.ToStatus(v));
            entity.Property(x => x.Channel).HasConversion(
                v => ChannelLabels.FromChannel(v),
                v => ChannelLabels.ToChannel(v));
            entity.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Total).HasPrecision(10, 2);
            entity.Property(x => x.SpecialInstructions).HasMaxLength(500);
            entity.Property(x => x.ReleaseError).HasMaxLength(500);
            entity.HasIndex(x => x.ScheduledFor);
            entity.HasOne(x => x.Customer)
                .WithMany(x => x.PlacedOrders)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Staff)
                .WithMany()
                .HasForeignKey(x => x.StaffId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OrderStatusEvent>(entity =>
        {
            entity.Property(x => x.Status).HasConversion(
                v => ChannelLabels.FromStatus(v),
                v => ChannelLabels.ToStatus(v));
            entity.Property(x => x.Note).HasMaxLength(400);
            entity.HasIndex(x => x.OrderId);
            entity.HasOne(x => x.Order)
                .WithMany(x => x.StatusHistory)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Actor)
                .WithMany()
                .HasForeignKey(x => x.ActorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<IdempotencyRecord>(entity =>
        {
            entity.Property(x => x.Key).HasMaxLength(80).IsRequired();
            entity.Property(x => x.RequestHash).HasMaxLength(64).IsRequired();
            entity.HasIndex(x => new { x.CustomerId, x.Key }).IsUnique();
            entity.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LoyaltyTransaction>(entity =>
        {
            entity.Property(x => x.Type).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Reason).HasMaxLength(200).IsRequired();
            entity.HasIndex(x => new { x.OrderId, x.Type }).IsUnique();
            entity.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.UnitPrice).HasPrecision(10, 2);
            entity.Property(x => x.Subtotal).HasPrecision(10, 2);
            entity.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId);
            entity.HasOne(x => x.MenuItem).WithMany(x => x.OrderItems).HasForeignKey(x => x.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(x => x.AddedByName).HasMaxLength(160);
            entity.HasOne(x => x.AddedBy)
                .WithMany()
                .HasForeignKey(x => x.AddedByCustomerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<GroupBasket>(entity =>
        {
            entity.Property(x => x.JoinCode).HasMaxLength(12).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.SpecialInstructions).HasMaxLength(500);
            entity.HasIndex(x => x.JoinCode).IsUnique();
            entity.HasOne(x => x.Host)
                .WithMany()
                .HasForeignKey(x => x.HostCustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<GroupBasketParticipant>(entity =>
        {
            entity.HasIndex(x => new { x.GroupBasketId, x.CustomerId }).IsUnique();
            entity.HasOne(x => x.GroupBasket)
                .WithMany(x => x.Participants)
                .HasForeignKey(x => x.GroupBasketId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GroupBasketItem>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.UnitPrice).HasPrecision(10, 2);
            entity.Ignore(x => x.Subtotal);
            entity.Property(x => x.SpecialInstructions).HasMaxLength(500);
            entity.HasOne(x => x.GroupBasket)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.GroupBasketId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.MenuItem)
                .WithMany()
                .HasForeignKey(x => x.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(x => x.Action).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Entity).HasMaxLength(80).IsRequired();
            entity.HasOne(x => x.Admin).WithMany(x => x.AuditLogs).HasForeignKey(x => x.AdminId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(400).IsRequired();
        });
    }
}

internal static class ChannelLabels
{
    public static string FromStatus(OrderStatus status) =>
        status == OrderStatus.InKitchen ? "In kitchen" : status.ToString();

    public static OrderStatus ToStatus(string value) =>
        value == "In kitchen" ? OrderStatus.InKitchen : Enum.Parse<OrderStatus>(value);

    public static string FromChannel(OrderChannel channel)
    {
        if (channel == OrderChannel.InStore) return "In-store";
        if (channel == OrderChannel.MobileApp) return "Mobile app";
        if (channel == OrderChannel.UberEats) return "Uber Eats";
        if (channel == OrderChannel.MrD) return "Mr D";
        return channel.ToString();
    }

    public static OrderChannel ToChannel(string value)
    {
        if (value == "In-store") return OrderChannel.InStore;
        if (value == "Mobile app") return OrderChannel.MobileApp;
        if (value == "Uber Eats") return OrderChannel.UberEats;
        if (value == "Mr D") return OrderChannel.MrD;
        return Enum.Parse<OrderChannel>(value);
    }
}

