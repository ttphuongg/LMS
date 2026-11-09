using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.SetCopyStatus;

public sealed class SetCopyStatusHandler : IRequestHandler<SetCopyStatusCommand, bool>
{
    private readonly CatalogDbContext _db;

    public SetCopyStatusHandler(CatalogDbContext db) => _db = db;

    public async Task<bool> Handle(SetCopyStatusCommand request, CancellationToken ct)
    {
        var copy = await _db.BookCopies
            .FirstOrDefaultAsync(c => c.Id == request.CopyId, ct);

        if (copy is null)
            return false;

        if (request.ExpectedStatus.HasValue && copy.Status != request.ExpectedStatus.Value)
            return false;

        copy.Status = request.NewStatus;
        if (request.NewCondition.HasValue)
            copy.Condition = request.NewCondition.Value;

        copy.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return true;
    }
}

