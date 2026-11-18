using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Notifications.Features.EmailHandlers;

/// <summary>
/// Xử lý gửi email và tạo thông báo khi có độc giả đặt trước sách thành công.
/// </summary>
public class ReservationCreatedEmailHandler : INotificationHandler<ReservationCreatedEvent>
{
    private readonly ISender _sender;
    private readonly IEmailService _emailService;
    private readonly NotificationsDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<ReservationCreatedEmailHandler> _logger;

    public ReservationCreatedEmailHandler(
        ISender sender,
        IEmailService emailService,
        NotificationsDbContext db,
        IConfiguration config,
        ILogger<ReservationCreatedEmailHandler> logger)
    {
        _sender = sender;
        _emailService = emailService;
        _db = db;
        _config = config;
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

            // 3. Nếu sách chưa có sẵn (vào hàng chờ), tạo thông báo web cho độc giả
            // (Nếu sách có sẵn, ReservationReadyNotifHandler đã tạo thông báo sẵn sàng)
            if (!notification.IsReady)
            {
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
            }

            // 4. Soạn thảo và gửi email thương hiệu Libri
            var appUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
            var subject = notification.IsReady 
                ? "[Libri] Sách đặt trước đã sẵn sàng nhận tại quầy" 
                : "[Libri] Xác nhận đăng ký giữ chỗ sách thành công";

            var html = EmailTemplates.ReservationCreated(
                readerName: account.FullName,
                bookTitle: bookTitle,
                isReady: notification.IsReady,
                expiresAt: notification.ExpiresAt,
                appUrl: appUrl);

            await _emailService.SendEmailAsync(account.Email, subject, html, ct);
            _logger.LogInformation("Đã gửi email thông báo đặt trước sách thành công tới {Email} (Sách: {Title})", account.Email, bookTitle);
        }
        catch (Exception ex)
        {
            // Bắt lỗi an toàn, tuyệt đối không làm gián đoạn luồng đặt sách chính của người dùng
            _logger.LogError(ex, "Lỗi xảy ra khi xử lý gửi email cho ReservationCreatedEvent (AccountId: {AccountId})", notification.AccountId);
        }
    }
}

