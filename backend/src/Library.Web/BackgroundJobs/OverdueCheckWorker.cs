using Library.Modules.Core.Circulation.Contracts;
using MediatR;
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
                var sender = scope.ServiceProvider.GetRequiredService<ISender>();

                var overdueCount = await sender.Send(new ProcessOverdueLoansCommand(), stoppingToken);

                if (overdueCount > 0)
                {
                    _logger.LogInformation("Overdue check: {OverdueCount} newly overdue loans processed.", overdueCount);
                }

                var dueSoonCount = await sender.Send(new ProcessDueSoonLoansCommand(), stoppingToken);

                if (dueSoonCount > 0)
                {
                    _logger.LogInformation("Due-soon check: {DueSoonCount} loans approaching due date notified.", dueSoonCount);
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
