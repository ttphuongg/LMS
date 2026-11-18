using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

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
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    LoanSlipDetailId = table.Column<long>(type: "bigint", nullable: true),
                    IncidentId = table.Column<long>(type: "bigint", nullable: true),
                    FineType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    PaymentDueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Unpaid"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fines", x => x.Id);
                    table.CheckConstraint("CK_Fines_Amount", "\"Amount\" > 0");
                    table.CheckConstraint("CK_Fines_FineType", "\"FineType\" IN ('Overdue', 'Compensation', 'Other')");
                    table.CheckConstraint("CK_Fines_Status", "\"Status\" IN ('Unpaid', 'PartiallyPaid', 'Paid', 'Cancelled')");
                });

            migrationBuilder.CreateTable(
                name: "FinePayments",
                schema: "billing",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FineId = table.Column<long>(type: "bigint", nullable: false),
                    LibrarianId = table.Column<int>(type: "integer", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinePayments", x => x.Id);
                    table.CheckConstraint("CK_FinePayments_Amount", "\"Amount\" > 0");
                    table.CheckConstraint("CK_FinePayments_PaymentMethod", "\"PaymentMethod\" IN ('Cash', 'BankTransfer', 'Other')");
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
