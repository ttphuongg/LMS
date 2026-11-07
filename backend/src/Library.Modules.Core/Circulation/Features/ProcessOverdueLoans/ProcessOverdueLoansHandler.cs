using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Circulation.Features.ProcessOverdueLoans;

public sealed class ProcessOverdueLoansHandler : IRequestHandler<ProcessOverdueLoansCommand, int>
{
    private readonly AppDbContext _db;
    private readonly IPublisher _publisher;
    private readonly ILogger<ProcessOverdueLoansHandler> _logger;

    public ProcessOverdueLoansHandler(AppDbContext db, IPublisher publisher, ILogger<ProcessOverdueLoansHandler> logger)
    {
        _db = db;
        _publisher = publisher;
        _logger = logger;
    }

    public async Task<int> Handle(ProcessOverdueLoansCommand request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Only process loans that are NOT yet marked as Overdue to avoid repeating events
        var newlyOverdueDetails = await _db.LoanSlipDetails
            .Include(d => d.LoanSlip)
            .Where(d => d.Status == LoanDetailStatus.Borrowing &&
                        d.LoanSlip.DueDate < today &&
                        d.LoanSlip.Status != LoanStatus.Overdue)
            .ToListAsync(ct);

        if (newlyOverdueDetails.Count == 0)
            return 0;

        var eventsToPublish = new List<LoanOverdueEvent>();
        var updatedSlipIds = new HashSet<long>();

        foreach (var detail in newlyOverdueDetails)
        {
            if (updatedSlipIds.Add(detail.LoanSlipId))
            {
                detail.LoanSlip.Status = LoanStatus.Overdue;
                detail.LoanSlip.UpdatedAt = DateTime.UtcNow;
            }

            eventsToPublish.Add(new LoanOverdueEvent(
                detail.Id,
                detail.LoanSlip.AccountId,
                detail.BookCopyId,
                detail.LoanSlip.DueDate));
        }

        // Save changes to DB first to ensure persistence
        await _db.SaveChangesAsync(ct);

        // Publish events after DB transaction succeeded
        foreach (var evt in eventsToPublish)
        {
            try
            {
                await _publisher.Publish(evt, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish LoanOverdueEvent for detail ID {DetailId}", evt.LoanSlipDetailId);
            }
        }

        return updatedSlipIds.Count;
    }
}

