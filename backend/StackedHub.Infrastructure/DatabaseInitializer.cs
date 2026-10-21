using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace StackedHub.Infrastructure;

public static class DatabaseInitializer
{
    public static void Apply(AppDbContext db)
    {
        if (db.Database.IsSqlite())
        {
            db.Database.EnsureCreated();
            return;
        }

        if (!db.Database.IsSqlServer())
        {
            db.Database.EnsureCreated();
            return;
        }

        if (HasTable(db, "Orders") && !HasAppliedMigrations(db))
        {
            SqlServerUpgrades.Apply(db);
            StampAllMigrations(db);
            return;
        }

        db.Database.Migrate();
    }

    private static bool HasAppliedMigrations(AppDbContext db)
    {
        try
        {
            return db.Database.GetAppliedMigrations().Any();
        }
        catch (Exception)
        {
            return false;
        }
    }

    private static void StampAllMigrations(AppDbContext db)
    {
        var history = db.GetService<IHistoryRepository>();
        db.Database.ExecuteSqlRaw(history.GetCreateIfNotExistsScript());
        var applied = history.GetAppliedMigrations().Select(x => x.MigrationId).ToHashSet();
        foreach (var migrationId in db.Database.GetMigrations())
        {
            if (applied.Contains(migrationId))
            {
                continue;
            }

            db.Database.ExecuteSqlRaw(
                "INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1})",
                migrationId,
                "8.0.11");
        }
    }

    private static bool HasTable(AppDbContext db, string table) =>
        SqlServerUpgrades.TableExists(db, table);
}
