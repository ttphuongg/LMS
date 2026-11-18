using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Notifications.Services;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Notifications.Features.EmailHandlers;

/// <summary>
/// Xử lý gửi email khi sách đặt trước đã sẵn sàng tại quầy (ReservationReadyEvent).
/// Phục vụ cả 2 trường hợp: Đặt trước có sách ngay HOẶC sách được trả về và gán từ hàng chờ.
/// Gửi nền (non-blocking) qua IServiceScopeFactory để không làm chậm luồng xử lý.
/// </summary>
public class ReservationReadyEmailHandler : INotificationHandler<ReservationReadyEvent>
{
    private readonly ISender _sender;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationReadyEmailHandler> _logger;

    public ReservationReadyEmailHandler(
        ISender sender,
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        ILogger<ReservationReadyEmailHandler> logger)
    {
        _sender = sender;
        _config = config;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task Handle(ReservationReadyEvent notification, CancellationToken ct)
    {
        try
        {
            // 1. Lấy thông tin tài khoản độc giả qua Identity Contract
            var account = await _sender.Send(new GetAccountContactQuery(notification.AccountId), ct);
            if (account == null || string.IsNullOrWhiteSpace(account.Email))
            {
                _logger.LogWarning("Không tìm thấy thông tin tài khoản hoặc email cho AccountId {AccountId}", notification.AccountId);
                return;
            }

            // 2. Lấy tên sách từ bản sao nếu có
            var bookTitle = "Tác phẩm đặt trước";
            if (notification.BookCopyId.HasValue)
            {
                var copies = await _sender.Send(new GetCopyInfosQuery(new[] { notification.BookCopyId.Value }), ct);
                if (copies.TryGetValue(notification.BookCopyId.Value, out var copy))
                {
                    bookTitle = copy.BookTitle;
                }
            }

            // 3. Soạn email thông báo sách sẵn sàng tại quầy nhận trong 48h
            var appUrl = _config["FrontendUrl"] ?? _config["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://libri.id.vn";
            var subject = "[Libri] Sách đặt trước đã sẵn sàng nhận tại quầy";
            var html = EmailTemplates.ReservationCreated(
                readerName: account.FullName,
                bookTitle: bookTitle,
                isReady: true,
                expiresAt: notification.ExpiresAt,
                appUrl: appUrl);

            // 4. Gửi email bất đồng bộ nền (Non-blocking)
            var toEmail = account.Email;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await emailService.SendEmailAsync(toEmail, subject, html, CancellationToken.None);
                    _logger.LogInformation("Background: Đã gửi email báo sách sẵn sàng tới {Email} (Sách: {Title})", toEmail, bookTitle);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background: Lỗi khi gửi email báo sách sẵn sàng tới {Email}", toEmail);
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong ReservationReadyEmailHandler (AccountId: {AccountId})", notification.AccountId);
        }
    }
}

