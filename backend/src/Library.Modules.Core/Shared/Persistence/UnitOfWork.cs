using System.Data.Common;

namespace Library.Modules.Core.Shared.Persistence;

public sealed class UnitOfWork
{
    public DbTransaction? Current { get; set; }
}

