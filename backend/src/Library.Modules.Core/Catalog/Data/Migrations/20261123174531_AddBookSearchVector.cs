using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace Library.Modules.Core.Catalog.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBookSearchVector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "SearchVector",
                schema: "catalog",
                table: "Books",
                type: "tsvector",
                nullable: true)
                .Annotation("Npgsql:TsVectorConfig", "simple")
                .Annotation("Npgsql:TsVectorProperties", new[] { "Title", "Description" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_SearchVector",
                schema: "catalog",
                table: "Books",
                column: "SearchVector")
                .Annotation("Npgsql:IndexMethod", "GIN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Books_SearchVector",
                schema: "catalog",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "SearchVector",
                schema: "catalog",
                table: "Books");
        }
    }
}
