using System.Data.Common;

namespace Library.Modules.Core.Shared.Persistence;

/// <summary>
/// Scoped tracker for the current active database transaction across multiple DbContexts.
/// </summary>
public sealed class UnitOfWork
{
    public DbTransaction? Current { get; set; }
}

