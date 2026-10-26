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
            Stamp(db, "20261021134032_AddOrderFoundation");
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

    private static void Stamp(AppDbContext db, string migrationId)
    {
        var history = db.GetService<IHistoryRepository>();
        db.Database.ExecuteSqlRaw(history.GetCreateIfNotExistsScript());
        if (history.GetAppliedMigrations().Any(x => x.MigrationId == migrationId))
        {
            return;
        }

        db.Database.ExecuteSqlRaw(
            "INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1})",
            migrationId,
            "8.0.11");
    }

    private static bool HasTable(AppDbContext db, string table) =>
        SqlServerUpgrades.TableExists(db, table);
}
