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
/// Xử lý gửi email và tạo thông báo hệ thống khi tài khoản độc giả bị tạm khóa.
/// Gửi email non-blocking qua IServiceScopeFactory để Admin thao tác tức thì.
/// </summary>
public class AccountLockedEmailHandler : INotificationHandler<AccountLockedEvent>
{
    private readonly ISender _sender;
    private readonly NotificationsDbContext _db;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AccountLockedEmailHandler> _logger;

    public AccountLockedEmailHandler(
        ISender sender,
        NotificationsDbContext db,
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        ILogger<AccountLockedEmailHandler> logger)
    {
        _sender = sender;
        _db = db;
        _config = config;
        _scopeFactory = scopeFactory;
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

            // 2. Thêm thông báo trên web cho tài khoản độc giả (nhanh ~2ms)
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
            var appUrl = _config["FrontendUrl"] ?? _config["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://libri.id.vn";
            var subject = "[Libri] Thông báo tạm khóa tài khoản độc giả";
            var html = EmailTemplates.AccountLocked(
                readerName: account.FullName,
                reason: notification.Reason,
                lockedAt: notification.LockedAt,
                appUrl: appUrl);

            // 4. Gửi email bất đồng bộ nền (Non-blocking)
            var toEmail = account.Email;
            var reason = notification.Reason;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await emailService.SendEmailAsync(toEmail, subject, html, CancellationToken.None);
                    _logger.LogInformation("Background: Đã gửi email thông báo khóa tài khoản tới {Email} (Lý do: {Reason})", toEmail, reason);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background: Lỗi khi gửi email thông báo khóa tài khoản tới {Email}", toEmail);
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong AccountLockedEmailHandler (AccountId: {AccountId})", notification.AccountId);
        }
    }
}
