using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Library.Modules.Core.Circulation.Data.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
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
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccountId = table.Column<int>(type: "int", nullable: false),
                    LibrarianId = table.Column<int>(type: "int", nullable: true),
                    BorrowedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Borrowing"),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoanSlips", x => x.Id);
                    table.CheckConstraint("CK_LoanSlips_DueDate", "[DueDate] >= CAST([BorrowedAt] AS DATE)");
                    table.CheckConstraint("CK_LoanSlips_Status", "[Status] IN (N'Pending', N'Borrowing', N'Returned', N'Overdue', N'Cancelled')");
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                schema: "circulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccountId = table.Column<int>(type: "int", nullable: false),
                    BookId = table.Column<int>(type: "int", nullable: false),
                    BookCopyId = table.Column<int>(type: "int", nullable: true),
                    ReservedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Waiting"),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.Id);
                    table.CheckConstraint("CK_Reservations_ExpiresAt", "[ExpiresAt] IS NULL OR [ExpiresAt] > [ReservedAt]");
                    table.CheckConstraint("CK_Reservations_Status", "[Status] IN (N'Waiting', N'Ready', N'Completed', N'Cancelled', N'Expired')");
                });

            migrationBuilder.CreateTable(
                name: "LoanSlipDetails",
                schema: "circulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoanSlipId = table.Column<long>(type: "bigint", nullable: false),
                    BookCopyId = table.Column<int>(type: "int", nullable: false),
                    ActualReturnDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Borrowing"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoanSlipDetails", x => x.Id);
                    table.CheckConstraint("CK_LoanSlipDetails_Status", "[Status] IN (N'Borrowing', N'Returned', N'Lost', N'Damaged')");
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
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoanSlipDetailId = table.Column<long>(type: "bigint", nullable: false),
                    LibrarianId = table.Column<int>(type: "int", nullable: true),
                    IncidentType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CompensationAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    RecordedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Recorded"),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                    table.CheckConstraint("CK_Incidents_CompensationAmount", "[CompensationAmount] >= 0");
                    table.CheckConstraint("CK_Incidents_IncidentType", "[IncidentType] IN (N'Lost', N'Damaged')");
                    table.CheckConstraint("CK_Incidents_Severity", "[Severity] IN (N'Minor', N'Major', N'TotalLoss')");
                    table.CheckConstraint("CK_Incidents_Status", "[Status] IN (N'Recorded', N'Resolved', N'Cancelled')");
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
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoanSlipDetailId = table.Column<long>(type: "bigint", nullable: false),
                    RenewalNumber = table.Column<byte>(type: "tinyint", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    OldDueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    NewDueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    LibrarianId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Renewals", x => x.Id);
                    table.CheckConstraint("CK_Renewals_NewDueDate", "[NewDueDate] > [OldDueDate]");
                    table.CheckConstraint("CK_Renewals_RenewalNumber", "[RenewalNumber] > 0");
                    table.CheckConstraint("CK_Renewals_Status", "[Status] IN (N'Pending', N'Approved', N'Rejected', N'Cancelled')");
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
