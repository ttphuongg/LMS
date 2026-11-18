using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Notifications.Services;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Notifications.Features.EmailHandlers;

/// <summary>
/// Xử lý gửi email và tạo thông báo khi độc giả đăng ký giữ chỗ sách vào hàng chờ (IsReady = false).
/// Email được gửi bất đồng bộ nền (non-blocking) qua IServiceScopeFactory để giao diện phản hồi tức thì.
/// </summary>
public class ReservationCreatedEmailHandler : INotificationHandler<ReservationCreatedEvent>
{
    private readonly ISender _sender;
    private readonly NotificationsDbContext _db;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationCreatedEmailHandler> _logger;

    public ReservationCreatedEmailHandler(
        ISender sender,
        NotificationsDbContext db,
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        ILogger<ReservationCreatedEmailHandler> logger)
    {
        _sender = sender;
        _db = db;
        _config = config;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task Handle(ReservationCreatedEvent notification, CancellationToken ct)
    {
        try
        {
            // 1. Lấy thông tin liên hệ của độc giả từ Identity Module qua MediatR Contract
            var account = await _sender.Send(new GetAccountContactQuery(notification.AccountId), ct);
            if (account == null || string.IsNullOrWhiteSpace(account.Email))
            {
                _logger.LogWarning("Không tìm thấy thông tin tài khoản hoặc email cho AccountId {AccountId}", notification.AccountId);
                return;
            }

            // 2. Lấy tên sách từ Catalog Module qua Contract
            var books = await _sender.Send(new GetBookInfosQuery(new[] { notification.BookId }), ct);
            var bookTitle = books.TryGetValue(notification.BookId, out var book) ? book.Title : "Sách thư viện";

            // 3. Tạo thông báo trên giao diện Web cho độc giả (nhanh ~2ms)
            var notif = new Notification
            {
                AccountId = notification.AccountId,
                Title = "Đăng ký giữ chỗ sách thành công",
                Content = $"Bạn đã đăng ký giữ chỗ thành công cho tác phẩm '{bookTitle}'. Thư viện sẽ gửi thông báo và email ngay khi có sách hoàn trả.",
                NotificationType = NotificationType.Reserve,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync(ct);

            // 4. Soạn thảo email
            var appUrl = _config["FrontendUrl"] ?? _config["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://libri.id.vn";
            var subject = "[Libri] Xác nhận đăng ký giữ chỗ sách thành công";
            var html = EmailTemplates.ReservationCreated(
                readerName: account.FullName,
                bookTitle: bookTitle,
                isReady: false,
                expiresAt: null,
                appUrl: appUrl);

            // 5. Gửi email bất đồng bộ nền (Non-blocking) với Scope độc lập
            var toEmail = account.Email;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await emailService.SendEmailAsync(toEmail, subject, html, CancellationToken.None);
                    _logger.LogInformation("Background: Đã gửi email xác nhận giữ chỗ tới {Email} (Sách: {Title})", toEmail, bookTitle);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background: Lỗi khi gửi email xác nhận giữ chỗ tới {Email}", toEmail);
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong ReservationCreatedEmailHandler (AccountId: {AccountId})", notification.AccountId);
        }
    }
}
