using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ExpireReservations;

public sealed class ExpireReservationsHandler : IRequestHandler<ExpireReservationsCommand, int>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;
    private readonly IMediator _mediator;

    public ExpireReservationsHandler(CirculationDbContext db, ISender sender, IMediator mediator)
    {
        _db = db;
        _sender = sender;
        _mediator = mediator;
    }

    public async Task<int> Handle(ExpireReservationsCommand request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var expired = await _db.Reservations
            .Where(r => r.Status == ReservationStatus.Ready && r.ExpiresAt != null && r.ExpiresAt < now)
            .ToListAsync(ct);

        foreach (var res in expired)
        {
            res.Status = ReservationStatus.Expired;

            if (res.BookCopyId.HasValue)
            {
                var nextStatus = await _sender.Send(new ReleaseCopyCommand(res.BookId, res.BookCopyId.Value, res.Id), ct);
                await _sender.Send(new SetCopyStatusCommand(res.BookCopyId.Value, null, nextStatus), ct);
            }

            await _mediator.Publish(new ReservationExpiredEvent(res.Id, res.AccountId), ct);
        }

        if (expired.Count > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return expired.Count;
    }
}

