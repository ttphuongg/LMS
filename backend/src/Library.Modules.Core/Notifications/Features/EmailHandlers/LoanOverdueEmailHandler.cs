using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Notifications.Features.EmailHandlers;

/// <summary>
/// Xử lý gửi email cảnh báo khi sách mượn đã chính thức quá hạn.
/// Có cơ chế chống spam (không gửi dồn dập nhiều email trong 24 giờ).
/// </summary>
public class LoanOverdueEmailHandler : INotificationHandler<LoanOverdueEvent>
{
    private readonly ISender _sender;
    private readonly IEmailService _emailService;
    private readonly NotificationsDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<LoanOverdueEmailHandler> _logger;

    public LoanOverdueEmailHandler(
        ISender sender,
        IEmailService emailService,
        NotificationsDbContext db,
        IConfiguration config,
        ILogger<LoanOverdueEmailHandler> logger)
    {
        _sender = sender;
        _emailService = emailService;
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task Handle(LoanOverdueEvent notification, CancellationToken ct)
    {
        try
        {
            // 1. Cơ chế chống spam: Kiểm tra xem đã gửi email quá hạn cho độc giả này trong 24 giờ qua chưa.
            // (Trừ khoảng đệm 2 phút gần nhất để tránh nhầm với chính đợt quét hiện tại do LoanOverdueNotifHandler vừa tạo)
            var cutoff = DateTime.UtcNow.AddHours(-24);
            var recentThreshold = DateTime.UtcNow.AddMinutes(-2);
            var alreadySentPreviously = await _db.Notifications.AnyAsync(n =>
                n.AccountId == notification.AccountId &&
                n.NotificationType == NotificationType.Borrow &&
                n.Title == "Sách quá hạn trả" &&
                n.CreatedAt >= cutoff &&
                n.CreatedAt < recentThreshold, ct);

            if (alreadySentPreviously)
            {
                _logger.LogInformation("Bỏ qua gửi email nhắc quá hạn cho AccountId {AccountId} (đã gửi thông báo trong 24 giờ qua)", notification.AccountId);
                return;
            }

            // 2. Lấy thông tin tài khoản độc giả qua Identity Contract
            var account = await _sender.Send(new GetAccountContactQuery(notification.AccountId), ct);
            if (account == null || string.IsNullOrWhiteSpace(account.Email))
            {
                _logger.LogWarning("Không tìm thấy thông tin tài khoản hoặc email cho AccountId {AccountId}", notification.AccountId);
                return;
            }

            // 3. Lấy thông tin bản sao và tác phẩm qua Catalog Contract
            var copies = await _sender.Send(new GetCopyInfosQuery(new[] { notification.BookCopyId }), ct);
            var bookTitle = copies.TryGetValue(notification.BookCopyId, out var copy) ? copy.BookTitle : "Sách mượn";

            // 4. Tính toán số ngày quá hạn và tiền phạt tạm tính theo múi giờ Việt Nam (+7)
            // Phí phạt mặc định: 5.000 VNĐ / ngày trễ
            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var daysOverdue = Math.Max(1, today.DayNumber - notification.DueDate.DayNumber);
            var fineAmount = daysOverdue * 5000m;

            // 5. Soạn và gửi email cảnh báo quá hạn
            var appUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
            var subject = $"[Libri] Cảnh báo: Sách '{bookTitle}' đã quá hạn trả {daysOverdue} ngày";
            var html = EmailTemplates.LoanOverdue(
                readerName: account.FullName,
                bookTitle: bookTitle,
                dueDate: notification.DueDate,
                daysOverdue: daysOverdue,
                fineAmount: fineAmount,
                appUrl: appUrl);

            await _emailService.SendEmailAsync(account.Email, subject, html, ct);
            _logger.LogInformation("Đã gửi email cảnh báo quá hạn tới {Email} (Sách: {Title}, Quá hạn: {Days} ngày, Phạt: {Fine:N0}đ)", 
                account.Email, bookTitle, daysOverdue, fineAmount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi gửi email cảnh báo quá hạn cho AccountId {AccountId}, CopyId {CopyId}", 
                notification.AccountId, notification.BookCopyId);
        }
    }
}

