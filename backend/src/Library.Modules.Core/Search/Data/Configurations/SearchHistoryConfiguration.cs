using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Search.Data.Configurations;

public class SearchHistoryConfiguration : IEntityTypeConfiguration<SearchHistory>
{
    public void Configure(EntityTypeBuilder<SearchHistory> builder)
    {
        builder.ToTable("SearchHistories");
        builder.HasKey(sh => sh.Id);

        builder.Property(sh => sh.Keyword).HasMaxLength(500).IsRequired();
        builder.Property(sh => sh.SearchType).HasMaxLength(30).HasDefaultValue("BOOK");
        builder.Property(sh => sh.SearchedAt).HasDefaultValueSql("SYSDATETIME()");

        // CK_LichSuTimKiem_SoKetQua
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_SearchHistories_ResultCount",
            "[ResultCount] IS NULL OR [ResultCount] >= 0"));
    }
}
