using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Library.Web.BackgroundJobs;

public class OverdueCheckWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OverdueCheckWorker> _logger;

    public OverdueCheckWorker(IServiceScopeFactory scopeFactory, ILogger<OverdueCheckWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                var today = DateOnly.FromDateTime(DateTime.UtcNow);

                // ── 1. Check newly overdue loan slips ────────────────────────
                // Only process loans that are NOT yet marked as Overdue to avoid repeating events
                var newlyOverdueDetails = await db.LoanSlipDetails
                    .Include(d => d.LoanSlip)
                    .Where(d => d.Status == LoanDetailStatus.Borrowing &&
                                d.LoanSlip.DueDate < today &&
                                d.LoanSlip.Status != LoanStatus.Overdue)
                    .ToListAsync(stoppingToken);

                var eventsToPublish = new List<LoanOverdueEvent>();

                foreach (var detail in newlyOverdueDetails)
                {
                    detail.LoanSlip.Status = LoanStatus.Overdue;
                    detail.LoanSlip.UpdatedAt = DateTime.UtcNow;

                    eventsToPublish.Add(new LoanOverdueEvent(
                        detail.Id,
                        detail.LoanSlip.AccountId,
                        detail.BookCopyId,
                        detail.LoanSlip.DueDate));
                }

                // ── 2. Check and expire reservations past ExpiresAt ─────────
                var expiredReservations = await db.Reservations
                    .Where(r => r.Status == ReservationStatus.Ready &&
                                r.ExpiresAt.HasValue &&
                                r.ExpiresAt.Value < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                foreach (var res in expiredReservations)
                {
                    res.Status = ReservationStatus.Expired;

                    if (res.BookCopyId.HasValue)
                    {
                        var copy = await db.BookCopies.FindAsync(new object[] { res.BookCopyId.Value }, stoppingToken);
                        if (copy != null && copy.Status == CopyStatus.Reserved)
                        {
                            // Assign copy to next waiting reservation (FIFO)
                            var nextWaiting = await db.Reservations
                                .Where(r => r.BookId == res.BookId && r.Status == ReservationStatus.Waiting && r.Id != res.Id)
                                .OrderBy(r => r.ReservedAt)
                                .FirstOrDefaultAsync(stoppingToken);

                            if (nextWaiting != null)
                            {
                                nextWaiting.BookCopyId = copy.Id;
                                nextWaiting.Status = ReservationStatus.Ready;
                                nextWaiting.ExpiresAt = DateTime.UtcNow.AddDays(3);
                            }
                            else
                            {
                                copy.Status = CopyStatus.Available;
                            }
                        }
                    }
                }

                // Save changes to DB first to ensure persistence
                if (newlyOverdueDetails.Count > 0 || expiredReservations.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Overdue & Expiry check: {OverdueCount} newly overdue loans, {ExpiredCount} expired reservations.",
                        newlyOverdueDetails.Count, expiredReservations.Count);
                }

                // Publish events after DB transaction succeeded
                foreach (var evt in eventsToPublish)
                {
                    try
                    {
                        await mediator.Publish(evt, stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to publish LoanOverdueEvent for detail ID {DetailId}", evt.LoanSlipDetailId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during overdue & reservation check.");
            }

            // Run every 6 hours
            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}
