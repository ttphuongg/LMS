using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ReleaseCopy;

public sealed class ReleaseCopyHandler : IRequestHandler<ReleaseCopyCommand, CopyStatus>
{
    private readonly CirculationDbContext _db;

    public ReleaseCopyHandler(CirculationDbContext db) => _db = db;

    public async Task<CopyStatus> Handle(ReleaseCopyCommand request, CancellationToken ct)
    {
        var query = _db.Reservations
            .Where(r => r.BookId == request.BookId && r.Status == ReservationStatus.Waiting);

        if (request.ExcludeReservationId.HasValue)
        {
            query = query.Where(r => r.Id != request.ExcludeReservationId.Value);
        }

        var nextReservation = await query.OrderBy(r => r.ReservedAt).FirstOrDefaultAsync(ct);
        if (nextReservation is not null)
        {
            nextReservation.BookCopyId = request.CopyId;
            nextReservation.Status = ReservationStatus.Ready;
            nextReservation.ExpiresAt = DateTime.UtcNow.AddDays(3);
            await _db.SaveChangesAsync(ct);
            return CopyStatus.Reserved;
        }

        return CopyStatus.Available;
    }
}

