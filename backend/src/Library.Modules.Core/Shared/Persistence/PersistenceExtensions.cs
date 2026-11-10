using System.Data.Common;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Library.Modules.Core.Shared.Persistence;

public static class PersistenceExtensions
{
    public static IServiceCollection AddSharedPersistence(this IServiceCollection services, string connectionString)
    {
        services.AddScoped<DbConnection>(_ => new SqlConnection(connectionString));
        services.AddScoped<UnitOfWork>();
        return services;
    }

    public static IServiceCollection AddModuleDbContext<TContext>(this IServiceCollection services)
        where TContext : DbContext
    {
        services.AddDbContext<TContext>((sp, options) =>
        {
            var conn = sp.GetRequiredService<DbConnection>();
            var schema = typeof(TContext).GetField("Schema")?.GetValue(null) as string;

            options.UseSqlServer(conn, sql =>
            {
                sql.MigrationsAssembly("Library.Modules.Core");
                if (!string.IsNullOrEmpty(schema))
                {
                    sql.MigrationsHistoryTable("__EFMigrationsHistory", schema);
                }
            });
        });

        services.AddScoped<DbContext>(sp => sp.GetRequiredService<TContext>());
        return services;
    }
}

