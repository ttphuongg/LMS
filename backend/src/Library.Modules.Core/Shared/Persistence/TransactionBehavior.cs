using System.Data;
using System.Data.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Shared.Persistence;

public sealed class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly DbConnection _conn;
    private readonly UnitOfWork _uow;
    private readonly IEnumerable<DbContext> _contexts;

    public TransactionBehavior(DbConnection conn, UnitOfWork uow, IEnumerable<DbContext> contexts)
    {
        _conn = conn;
        _uow = uow;
        _contexts = contexts;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (request is not ITransactionalCommand || _uow.Current is not null)
            return await next(ct);

        if (_conn.State != ConnectionState.Open) await _conn.OpenAsync(ct);
        await using var tx = await _conn.BeginTransactionAsync(ct);
        _uow.Current = tx;
        try
        {
            foreach (var ctx in _contexts) await ctx.Database.UseTransactionAsync(tx, ct);
            var result = await next(ct);
            if (result is IApiResult { Success: false }) await tx.RollbackAsync(ct);
            else await tx.CommitAsync(ct);
            return result;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
        finally
        {
            foreach (var ctx in _contexts)
            {
                try
                {
                    await ctx.Database.UseTransactionAsync(null, CancellationToken.None);
                }
                catch
                {
                    // Ignore context disposal or transaction detach issues in cleanup
                }
            }
            _uow.Current = null;
        }
    }
}

