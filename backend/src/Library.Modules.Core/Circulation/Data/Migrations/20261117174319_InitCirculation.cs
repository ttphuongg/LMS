using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Library.Modules.Core.Circulation.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitCirculation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "circulation");

            migrationBuilder.CreateTable(
                name: "LoanSlips",
                schema: "circulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    LibrarianId = table.Column<int>(type: "integer", nullable: true),
                    BorrowedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Borrowing"),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoanSlips", x => x.Id);
                    table.CheckConstraint("CK_LoanSlips_DueDate", "\"DueDate\" >= CAST(\"BorrowedAt\" AS DATE)");
                    table.CheckConstraint("CK_LoanSlips_Status", "\"Status\" IN ('Pending', 'Borrowing', 'Returned', 'Overdue', 'Cancelled')");
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                schema: "circulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    BookId = table.Column<int>(type: "integer", nullable: false),
                    BookCopyId = table.Column<int>(type: "integer", nullable: true),
                    ReservedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Waiting"),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.Id);
                    table.CheckConstraint("CK_Reservations_ExpiresAt", "\"ExpiresAt\" IS NULL OR \"ExpiresAt\" > \"ReservedAt\"");
                    table.CheckConstraint("CK_Reservations_Status", "\"Status\" IN ('Waiting', 'Ready', 'Completed', 'Cancelled', 'Expired')");
                });

            migrationBuilder.CreateTable(
                name: "LoanSlipDetails",
                schema: "circulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LoanSlipId = table.Column<long>(type: "bigint", nullable: false),
                    BookCopyId = table.Column<int>(type: "integer", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ActualReturnDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Borrowing"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoanSlipDetails", x => x.Id);
                    table.CheckConstraint("CK_LoanSlipDetails_Status", "\"Status\" IN ('Borrowing', 'Returned', 'Lost', 'Damaged')");
                    table.ForeignKey(
                        name: "FK_LoanSlipDetails_LoanSlips_LoanSlipId",
                        column: x => x.LoanSlipId,
                        principalSchema: "circulation",
                        principalTable: "LoanSlips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Incidents",
                schema: "circulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LoanSlipDetailId = table.Column<long>(type: "bigint", nullable: false),
                    LibrarianId = table.Column<int>(type: "integer", nullable: true),
                    IncidentType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CompensationAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    RecordedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Recorded"),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                    table.CheckConstraint("CK_Incidents_CompensationAmount", "\"CompensationAmount\" >= 0");
                    table.CheckConstraint("CK_Incidents_IncidentType", "\"IncidentType\" IN ('Lost', 'Damaged')");
                    table.CheckConstraint("CK_Incidents_Severity", "\"Severity\" IN ('Minor', 'Major', 'TotalLoss')");
                    table.CheckConstraint("CK_Incidents_Status", "\"Status\" IN ('Recorded', 'Resolved', 'Cancelled')");
                    table.ForeignKey(
                        name: "FK_Incidents_LoanSlipDetails_LoanSlipDetailId",
                        column: x => x.LoanSlipDetailId,
                        principalSchema: "circulation",
                        principalTable: "LoanSlipDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Renewals",
                schema: "circulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LoanSlipDetailId = table.Column<long>(type: "bigint", nullable: false),
                    RenewalNumber = table.Column<byte>(type: "smallint", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    OldDueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    NewDueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    LibrarianId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Renewals", x => x.Id);
                    table.CheckConstraint("CK_Renewals_NewDueDate", "\"NewDueDate\" > \"OldDueDate\"");
                    table.CheckConstraint("CK_Renewals_RenewalNumber", "\"RenewalNumber\" > 0");
                    table.CheckConstraint("CK_Renewals_Status", "\"Status\" IN ('Pending', 'Approved', 'Rejected', 'Cancelled')");
                    table.ForeignKey(
                        name: "FK_Renewals_LoanSlipDetails_LoanSlipDetailId",
                        column: x => x.LoanSlipDetailId,
                        principalSchema: "circulation",
                        principalTable: "LoanSlipDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_LoanSlipDetailId",
                schema: "circulation",
                table: "Incidents",
                column: "LoanSlipDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_LoanSlipDetails_LoanSlipId_BookCopyId",
                schema: "circulation",
                table: "LoanSlipDetails",
                columns: new[] { "LoanSlipId", "BookCopyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Renewals_LoanSlipDetailId_RenewalNumber",
                schema: "circulation",
                table: "Renewals",
                columns: new[] { "LoanSlipDetailId", "RenewalNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Incidents",
                schema: "circulation");

            migrationBuilder.DropTable(
                name: "Renewals",
                schema: "circulation");

            migrationBuilder.DropTable(
                name: "Reservations",
                schema: "circulation");

            migrationBuilder.DropTable(
                name: "LoanSlipDetails",
                schema: "circulation");

            migrationBuilder.DropTable(
                name: "LoanSlips",
                schema: "circulation");
        }
    }
}
