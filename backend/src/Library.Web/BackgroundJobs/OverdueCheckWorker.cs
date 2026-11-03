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

                var overdueDetails = await db.LoanSlipDetails
                    .Include(d => d.LoanSlip)
                    .Where(d => d.Status == LoanDetailStatus.Borrowing &&
                                d.LoanSlip.DueDate < today)
                    .ToListAsync(stoppingToken);

                foreach (var detail in overdueDetails)
                {
                    detail.Status = LoanDetailStatus.Borrowing; // still borrowing but overdue
                    detail.LoanSlip.Status = LoanStatus.Overdue;

                    await mediator.Publish(new LoanOverdueEvent(
                        detail.Id,
                        detail.LoanSlip.AccountId,
                        detail.BookCopyId,
                        detail.LoanSlip.DueDate), stoppingToken);
                }

                if (overdueDetails.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Overdue check: found {Count} overdue loans.", overdueDetails.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during overdue check.");
            }

            // Run every 6 hours
            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}
