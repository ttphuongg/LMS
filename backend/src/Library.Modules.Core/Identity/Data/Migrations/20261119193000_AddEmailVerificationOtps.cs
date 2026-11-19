using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Library.Modules.Core.Identity.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailVerificationOtps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailVerificationOtps",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", unicode: false, maxLength: 150, nullable: false),
                    OtpHash = table.Column<string>(type: "character varying(64)", unicode: false, maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UsedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailVerificationOtps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailVerificationOtps_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalSchema: "identity",
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationOtps_AccountId_UsedAt",
                schema: "identity",
                table: "EmailVerificationOtps",
                columns: new[] { "AccountId", "UsedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationOtps_Email",
                schema: "identity",
                table: "EmailVerificationOtps",
                column: "Email");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailVerificationOtps",
                schema: "identity");
        }
    }
}
