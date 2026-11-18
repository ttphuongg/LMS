using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Notifications.Services;

public sealed class EmailService : IEmailService
{
    private readonly IConfiguration _cfg;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration cfg, ILogger<EmailService> logger)
    {
        _cfg = cfg;
        _logger = logger;
    }

    /// <summary>
    /// Gửi email tổng quát qua giao thức SMTP. Nếu chưa cấu hình SMTP, ghi log ra console để phục vụ kiểm thử.
    /// </summary>
    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        // Log ra console để tiện kiểm thử ngay lập tức (kể cả khi chưa cấu hình SMTP server)
        var consoleNotice = $"""
        ================================================================================
        [THÔNG BÁO GỬI EMAIL - HỆ THỐNG THƯ VIỆN LIBRI]
        Gửi đến: {toEmail}
        Tiêu đề: {subject}
        Thời gian: {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm:ss} (UTC+7)
        ================================================================================
        """;
        Console.WriteLine(consoleNotice);
        _logger.LogInformation("Email dispatch prepared for {Email} with subject '{Subject}'", toEmail, subject);

        var smtpHost = _cfg["Smtp:Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST");
        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            _logger.LogWarning("SMTP host is not configured. Email to {Email} was logged to console only.", toEmail);
            return;
        }

        var portString = _cfg["Smtp:Port"] ?? Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587";
        int.TryParse(portString, out var port);
        if (port <= 0) port = 587;

        var username = _cfg["Smtp:Username"] ?? Environment.GetEnvironmentVariable("SMTP_USERNAME");
        var password = _cfg["Smtp:Password"] ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        var fromEmail = _cfg["Smtp:FromEmail"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? username ?? "noreply@libri.id.vn";
        var fromName = _cfg["Smtp:FromName"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? "Thư Viện Libri";
        var enableSsl = bool.TryParse(_cfg["Smtp:EnableSsl"] ?? Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL"), out var ssl) ? ssl : true;

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            // Chấp nhận chứng chỉ nếu có cảnh báo tên miền SSL trung gian
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            var secureSocketOptions = port switch
            {
                465 => SecureSocketOptions.SslOnConnect,
                587 => SecureSocketOptions.StartTls,
                _ => enableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None
            };

            await client.ConnectAsync(smtpHost, port, secureSocketOptions, ct);

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                var cleanPassword = password.Trim().Trim('"', '\'');
                await client.AuthenticateAsync(username.Trim(), cleanPassword, ct);
            }

            await client.SendAsync(FormatOptions.Default, message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("Email sent successfully to {Email} with subject '{Subject}'", toEmail, subject);
            Console.WriteLine($"[SMTP SUCCESS] Đã gửi email thành công tới {toEmail} qua {smtpHost}:{port} | Tiêu đề: {subject}");
        }
        catch (Exception ex)
        {
            var errDetail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            Console.WriteLine($"[SMTP ERROR] Không thể gửi mail tới {toEmail} qua {smtpHost}:{port} (User: {username}): {errDetail}");
            _logger.LogError(ex, "Failed to send email to {Email}. Detail: {Detail}", toEmail, errDetail);
        }
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken, string otpCode, CancellationToken ct = default)
    {
        var frontendUrl = _cfg["FrontendUrl"]
            ?? _cfg["FRONTEND_URL"]
            ?? _cfg["AppUrl"]
            ?? Environment.GetEnvironmentVariable("FRONTEND_URL")
            ?? "https://libri.id.vn";

        var resetLink = $"{frontendUrl.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(toEmail)}&token={resetToken}";

        // In rõ mã OTP và link reset ra Console phục vụ test nhanh ngay trên Terminal / Docker log
        var resetNotice = $"""
        ================================================================================
        [THÔNG BÁO GỬI EMAIL ĐẶT LẠI MẬT KHẨU]
        Gửi đến: {toEmail}
        Mã xác thực OTP (6 chữ số): {otpCode}
        Đường dẫn đặt lại mật khẩu: {resetLink}
        Thời hạn sử dụng: 15 phút
        ================================================================================
        """;
        Console.WriteLine(resetNotice);
        _logger.LogInformation("Password reset email prepared for {Email}. OTP: {Otp}, Link: {Link}", toEmail, otpCode, resetLink);

        var htmlBody = $"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0d8c8; border-radius: 8px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #003D28; margin: 0; font-family: Georgia, serif;">LIBRI</h2>
                <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Cổng thông tin & quản lý bạn đọc</p>
            </div>

            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
                Xin chào bạn,
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
                Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>{System.Net.WebUtility.HtmlEncode(toEmail)}</strong>.
            </p>

            <div style="background-color: #f9f6f0; border: 1px dashed #d1c7b7; border-radius: 6px; padding: 18px; margin: 24px 0; text-align: center;">
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Mã xác thực OTP của bạn</div>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #003D28; font-family: monospace;">{otpCode}</div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">(Hiệu lực trong vòng 15 phút)</div>
            </div>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{resetLink}" style="display: inline-block; background-color: #003D28; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 6px;">
                    Đặt Lại Mật Khẩu Ngay
                </a>
            </div>

            <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
                Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br/>
                <a href="{resetLink}" style="color: #003D28; word-break: break-all;">{resetLink}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
                * Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn được an toàn.
            </p>
        </div>
        """;

        await SendEmailAsync(toEmail, "[Libri] Yêu cầu đặt lại mật khẩu tài khoản", htmlBody, ct);
    }
}

