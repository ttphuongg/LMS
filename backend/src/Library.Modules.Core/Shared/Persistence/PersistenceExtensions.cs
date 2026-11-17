using System.Data.Common;
using Npgsql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Library.Modules.Core.Shared.Persistence;

public static class PersistenceExtensions
{
    public static IServiceCollection AddSharedPersistence(this IServiceCollection services, string connectionString)
    {
        services.AddScoped<DbConnection>(_ => new NpgsqlConnection(connectionString));
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
            options.UseNpgsql(conn, npgsql =>
            {
                npgsql.MigrationsAssembly("Library.Modules.Core");
                if (!string.IsNullOrEmpty(schema))
                    npgsql.MigrationsHistoryTable("__EFMigrationsHistory", schema);
            });
        });
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<TContext>());
        return services;
    }
}

