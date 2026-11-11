using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Library.Modules.Core.Billing.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitBilling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "billing");

            migrationBuilder.CreateTable(
                name: "Fines",
                schema: "billing",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccountId = table.Column<int>(type: "int", nullable: false),
                    LoanSlipDetailId = table.Column<long>(type: "bigint", nullable: true),
                    IncidentId = table.Column<long>(type: "bigint", nullable: true),
                    FineType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    PaymentDueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Unpaid"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fines", x => x.Id);
                    table.CheckConstraint("CK_Fines_Amount", "[Amount] > 0");
                    table.CheckConstraint("CK_Fines_FineType", "[FineType] IN (N'Overdue', N'Compensation', N'Other')");
                    table.CheckConstraint("CK_Fines_Status", "[Status] IN (N'Unpaid', N'PartiallyPaid', N'Paid', N'Cancelled')");
                });

            migrationBuilder.CreateTable(
                name: "FinePayments",
                schema: "billing",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FineId = table.Column<long>(type: "bigint", nullable: false),
                    LibrarianId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinePayments", x => x.Id);
                    table.CheckConstraint("CK_FinePayments_Amount", "[Amount] > 0");
                    table.CheckConstraint("CK_FinePayments_PaymentMethod", "[PaymentMethod] IN (N'Cash', N'BankTransfer', N'Other')");
                    table.ForeignKey(
                        name: "FK_FinePayments_Fines_FineId",
                        column: x => x.FineId,
                        principalSchema: "billing",
                        principalTable: "Fines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FinePayments_FineId",
                schema: "billing",
                table: "FinePayments",
                column: "FineId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinePayments",
                schema: "billing");

            migrationBuilder.DropTable(
                name: "Fines",
                schema: "billing");
        }
    }
}
