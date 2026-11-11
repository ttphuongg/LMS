using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared.Events;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Services;

public static class ReservationQueue
{
    public static readonly TimeSpan PickupWindow = TimeSpan.FromHours(48);

    public static async Task<Reservation?> AssignNextAsync(
        CirculationDbContext db, BookCopy copy, List<long> assignedIds, CancellationToken ct)
    {
        var next = await db.Reservations
            .Where(r => r.BookId == copy.BookId
                     && r.Status == ReservationStatus.Waiting
                     && !assignedIds.Contains(r.Id))
            .OrderBy(r => r.ReservedAt)
            .FirstOrDefaultAsync(ct);

        if (next == null)
        {
            copy.Status = CopyStatus.Available;
            return null;
        }

        copy.Status = CopyStatus.Reserved;
        next.Status = ReservationStatus.Ready;
        next.BookCopyId = copy.Id;
        next.ExpiresAt = DateTime.UtcNow.Add(PickupWindow);
        assignedIds.Add(next.Id);
        return next;
    }

    public static ReservationReadyEvent ToReadyEvent(Reservation r) =>
        new(r.Id, r.AccountId, r.BookCopyId, r.ExpiresAt);
}
