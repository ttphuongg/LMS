using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Notifications.Features.EmailHandlers;

/// <summary>
/// Xử lý gửi email và tạo thông báo hệ thống khi tài khoản độc giả bị tạm khóa.
/// </summary>
public class AccountLockedEmailHandler : INotificationHandler<AccountLockedEvent>
{
    private readonly ISender _sender;
    private readonly IEmailService _emailService;
    private readonly NotificationsDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AccountLockedEmailHandler> _logger;

    public AccountLockedEmailHandler(
        ISender sender,
        IEmailService emailService,
        NotificationsDbContext db,
        IConfiguration config,
        ILogger<AccountLockedEmailHandler> logger)
    {
        _sender = sender;
        _emailService = emailService;
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task Handle(AccountLockedEvent notification, CancellationToken ct)
    {
        try
        {
            // 1. Lấy thông tin tài khoản qua Identity Contract
            var account = await _sender.Send(new GetAccountContactQuery(notification.AccountId), ct);
            if (account == null || string.IsNullOrWhiteSpace(account.Email))
            {
                _logger.LogWarning("Không tìm thấy thông tin tài khoản hoặc email cho AccountId {AccountId}", notification.AccountId);
                return;
            }

            // 2. Thêm thông báo trên web cho tài khoản độc giả
            var notif = new Notification
            {
                AccountId = notification.AccountId,
                Title = "Tài khoản bị tạm khóa",
                Content = $"Tài khoản của bạn đã bị tạm khóa vào lúc {notification.LockedAt.AddHours(7):dd/MM/yyyy HH:mm}. Lý do: {notification.Reason}. Vui lòng liên hệ quầy thủ thư để được hỗ trợ.",
                NotificationType = NotificationType.System,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync(ct);

            // 3. Soạn và gửi email cảnh báo khóa tài khoản
            var appUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
            var subject = "[Libri] Thông báo tạm khóa tài khoản độc giả";
            var html = EmailTemplates.AccountLocked(
                readerName: account.FullName,
                reason: notification.Reason,
                lockedAt: notification.LockedAt,
                appUrl: appUrl);

            await _emailService.SendEmailAsync(account.Email, subject, html, ct);
            _logger.LogInformation("Đã gửi email thông báo khóa tài khoản tới {Email} (Lý do: {Reason})", account.Email, notification.Reason);
        }
        catch (Exception ex)
        {
            // An toàn không làm đứt gãy luồng xử lý của quản trị viên
            _logger.LogError(ex, "Lỗi xảy ra khi xử lý gửi email cho AccountLockedEvent (AccountId: {AccountId})", notification.AccountId);
        }
    }
}

