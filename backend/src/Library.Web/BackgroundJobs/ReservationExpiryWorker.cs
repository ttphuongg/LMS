using Library.Modules.Core.Circulation.Contracts;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Library.Web.BackgroundJobs;

public class ReservationExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationExpiryWorker> _logger;

    public ReservationExpiryWorker(IServiceScopeFactory scopeFactory, ILogger<ReservationExpiryWorker> logger)
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
                var expiredCount = await sender.Send(new ExpireReservationsCommand(), stoppingToken);
                if (expiredCount > 0)
                {
                    _logger.LogInformation("Reservation expiry: {Count} reservations expired.", expiredCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during reservation expiry check.");
            }

            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }
}
