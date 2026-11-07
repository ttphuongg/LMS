using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ExpireReservations;

public sealed class ExpireReservationsHandler : IRequestHandler<ExpireReservationsCommand, int>
{
    private readonly AppDbContext _db;
    private readonly ISender _sender;

    public ExpireReservationsHandler(AppDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<int> Handle(ExpireReservationsCommand request, CancellationToken ct)
    {
        var expiredReservations = await _db.Reservations
            .Where(r => r.Status == ReservationStatus.Ready &&
                        r.ExpiresAt.HasValue &&
                        r.ExpiresAt.Value < DateTime.UtcNow)
            .ToListAsync(ct);

        if (expiredReservations.Count == 0)
            return 0;

        foreach (var res in expiredReservations)
        {
            res.Status = ReservationStatus.Expired;

            if (res.BookCopyId.HasValue)
            {
                var copyDict = await _sender.Send(new GetCopyInfosQuery([res.BookCopyId.Value]), ct);
                if (copyDict.TryGetValue(res.BookCopyId.Value, out var copy) && copy.Status == CopyStatus.Reserved)
                {
                    // Assign copy to next waiting reservation (FIFO) via ReleaseCopyCommand
                    var newStatus = await _sender.Send(new ReleaseCopyCommand(res.BookId, copy.CopyId, res.Id), ct);
                    await _sender.Send(new SetCopyStatusCommand(copy.CopyId, CopyStatus.Reserved, newStatus), ct);
                }
            }
        }

        await _db.SaveChangesAsync(ct);
        return expiredReservations.Count;
    }
}

