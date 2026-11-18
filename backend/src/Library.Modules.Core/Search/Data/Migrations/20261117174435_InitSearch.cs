using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Library.Modules.Core.Search.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "search");

            migrationBuilder.CreateTable(
                name: "SearchHistories",
                schema: "search",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    Keyword = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SearchType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "BOOK"),
                    ResultCount = table.Column<int>(type: "integer", nullable: true),
                    SearchedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SearchHistories", x => x.Id);
                    table.CheckConstraint("CK_SearchHistories_ResultCount", "\"ResultCount\" IS NULL OR \"ResultCount\" >= 0");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SearchHistories",
                schema: "search");
        }
    }
}
