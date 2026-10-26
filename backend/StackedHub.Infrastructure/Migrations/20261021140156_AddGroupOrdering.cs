using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StackedHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupOrdering : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AddedByCustomerId",
                table: "OrderItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AddedByName",
                table: "OrderItems",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GroupBaskets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    JoinCode = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    HostCustomerId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OrderId = table.Column<int>(type: "int", nullable: true),
                    ScheduledFor = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SpecialInstructions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBaskets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupBaskets_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupBaskets_Users_HostCustomerId",
                        column: x => x.HostCustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupBasketItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupBasketId = table.Column<int>(type: "int", nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    SpecialInstructions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBasketItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupBasketItems_GroupBaskets_GroupBasketId",
                        column: x => x.GroupBasketId,
                        principalTable: "GroupBaskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupBasketItems_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupBasketItems_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupBasketParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupBasketId = table.Column<int>(type: "int", nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBasketParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupBasketParticipants_GroupBaskets_GroupBasketId",
                        column: x => x.GroupBasketId,
                        principalTable: "GroupBaskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupBasketParticipants_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_AddedByCustomerId",
                table: "OrderItems",
                column: "AddedByCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBasketItems_CustomerId",
                table: "GroupBasketItems",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBasketItems_GroupBasketId",
                table: "GroupBasketItems",
                column: "GroupBasketId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBasketItems_MenuItemId",
                table: "GroupBasketItems",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBasketParticipants_CustomerId",
                table: "GroupBasketParticipants",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBasketParticipants_GroupBasketId_CustomerId",
                table: "GroupBasketParticipants",
                columns: new[] { "GroupBasketId", "CustomerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupBaskets_HostCustomerId",
                table: "GroupBaskets",
                column: "HostCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBaskets_JoinCode",
                table: "GroupBaskets",
                column: "JoinCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupBaskets_OrderId",
                table: "GroupBaskets",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Users_AddedByCustomerId",
                table: "OrderItems",
                column: "AddedByCustomerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Users_AddedByCustomerId",
                table: "OrderItems");

            migrationBuilder.DropTable(
                name: "GroupBasketItems");

            migrationBuilder.DropTable(
                name: "GroupBasketParticipants");

            migrationBuilder.DropTable(
                name: "GroupBaskets");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_AddedByCustomerId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "AddedByCustomerId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "AddedByName",
                table: "OrderItems");
        }
    }
}
