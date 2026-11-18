using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Notifications.Services;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Notifications.Features.EmailHandlers;

/// <summary>
/// Xử lý gửi email nhắc nhở độc giả khi sách mượn sắp đến hạn trả trong 3 - 5 ngày.
/// Có cơ chế chống spam 5 ngày theo yêu cầu.
/// Gửi email nền qua IServiceScopeFactory (non-blocking).
/// </summary>
public class LoanDueSoonEmailHandler : INotificationHandler<LoanDueSoonEvent>
{
    private readonly ISender _sender;
    private readonly NotificationsDbContext _db;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LoanDueSoonEmailHandler> _logger;

    public LoanDueSoonEmailHandler(
        ISender sender,
        NotificationsDbContext db,
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        ILogger<LoanDueSoonEmailHandler> logger)
    {
        _sender = sender;
        _db = db;
        _config = config;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task Handle(LoanDueSoonEvent notification, CancellationToken ct)
    {
        try
        {
            // 1. Cơ chế chống spam 5 ngày: Kiểm tra xem đã gửi thông báo sắp đến hạn cho độc giả này trong vòng 5 ngày qua chưa
            var cutoff = DateTime.UtcNow.AddDays(-5);
            var alreadyNotified = await _db.Notifications.AnyAsync(n =>
                n.AccountId == notification.AccountId &&
                n.Title.Contains("sắp đến hạn") &&
                n.CreatedAt >= cutoff, ct);

            if (alreadyNotified)
            {
                _logger.LogInformation("Bỏ qua gửi nhắc nhở sắp đến hạn cho AccountId {AccountId} (đã thông báo trong 5 ngày qua)", notification.AccountId);
                return;
            }

            // 2. Lấy thông tin bản sao và tên sách từ Catalog Module
            var copies = await _sender.Send(new GetCopyInfosQuery(new[] { notification.BookCopyId }), ct);
            var bookTitle = copies.TryGetValue(notification.BookCopyId, out var copy) ? copy.BookTitle : "Sách mượn";

            // 3. Lấy thông tin tài khoản qua Identity Contract
            var account = await _sender.Send(new GetAccountContactQuery(notification.AccountId), ct);
            if (account == null || string.IsNullOrWhiteSpace(account.Email))
            {
                _logger.LogWarning("Không tìm thấy thông tin tài khoản hoặc email cho AccountId {AccountId}", notification.AccountId);
                return;
            }

            // 4. Tạo thông báo web cho độc giả
            var notif = new Notification
            {
                AccountId = notification.AccountId,
                Title = $"Sách sắp đến hạn trả: {bookTitle}",
                Content = $"Cuốn sách '{bookTitle}' bạn đang mượn sắp đến hạn trả vào ngày {notification.DueDate:dd/MM/yyyy} (còn {notification.DaysUntilDue} ngày). Vui lòng trả sách đúng hạn hoặc thực hiện gia hạn trực tuyến.",
                NotificationType = NotificationType.Borrow,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync(ct);

            // 5. Soạn email nhắc nhở chuẩn nhận diện thương hiệu Libri
            var appUrl = _config["FrontendUrl"] ?? _config["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://libri.id.vn";
            var subject = $"[Libri] Nhắc nhở: Sách '{bookTitle}' sắp đến hạn trả trong {notification.DaysUntilDue} ngày tới";
            var html = EmailTemplates.LoanDueSoon(
                readerName: account.FullName,
                bookTitle: bookTitle,
                dueDate: notification.DueDate,
                daysUntilDue: notification.DaysUntilDue,
                appUrl: appUrl);

            // 6. Gửi email bất đồng bộ nền (Non-blocking)
            var toEmail = account.Email;
            var dueDate = notification.DueDate;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await emailService.SendEmailAsync(toEmail, subject, html, CancellationToken.None);
                    _logger.LogInformation("Background: Đã gửi email nhắc nhở sắp đến hạn tới {Email} (Sách: {Title}, Hạn: {DueDate:dd/MM/yyyy})", toEmail, bookTitle, dueDate);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background: Lỗi khi gửi email nhắc sắp đến hạn tới {Email}", toEmail);
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong LoanDueSoonEmailHandler cho AccountId {AccountId}, CopyId {CopyId}", notification.AccountId, notification.BookCopyId);
        }
    }
}
