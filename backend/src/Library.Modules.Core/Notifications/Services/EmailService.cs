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
    /// Gửi email tổng quát qua giao thức SMTP.
    /// Sử dụng cơ chế xác thực chứng chỉ TLS mặc định của .NET / MailKit.
    /// Phân biệt rõ lỗi cấu hình, lỗi kết nối, lỗi xác thực và lỗi gửi thư.
    /// </summary>
    public async Task<EmailSendResult> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        // Ghi log trạng thái chuẩn bị gửi (tuyệt đối không ghi thông tin nhạy cảm / OTP)
        _logger.LogInformation("Preparing to send email to {Email} with subject '{Subject}'", toEmail, subject);

        var smtpHost = _cfg["Smtp:Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST");
        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            var msg = "Máy chủ chưa được cấu hình dịch vụ gửi email (thiếu SMTP_HOST). Vui lòng cấu hình SMTP hoặc liên hệ quản trị viên.";
            _logger.LogWarning("SMTP host is not configured. Email to {Email} was not sent.", toEmail);
            return EmailSendResult.Failed(msg, EmailFailureType.ConfigurationMissing);
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

            // SỬ DỤNG CƠ CHẾ XÁC THỰC CHỨNG CHỈ TLS MẶC ĐỊNH CỦA MAILKIT / .NET
            // Loại bỏ hoàn toàn callback chấp nhận mọi chứng chỉ để đảm bảo an toàn kết nối,
            // không bỏ qua lỗi chứng chỉ không hợp lệ, hết hạn hoặc không khớp hostname.

            var secureSocketOptions = port switch
            {
                465 => SecureSocketOptions.SslOnConnect,
                587 => SecureSocketOptions.StartTls,
                _ => enableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None
            };

            try
            {
                await client.ConnectAsync(smtpHost, port, secureSocketOptions, ct);
            }
            catch (SslHandshakeException sslEx)
            {
                var errDetail = sslEx.InnerException != null ? $"{sslEx.Message} -> {sslEx.InnerException.Message}" : sslEx.Message;
                _logger.LogError(sslEx, "TLS certificate validation failed when connecting to SMTP host {Host}:{Port}. Detail: {Detail}", smtpHost, port, errDetail);
                return EmailSendResult.Failed($"Lỗi bảo mật TLS: Chứng chỉ của máy chủ thư ({smtpHost}:{port}) không hợp lệ hoặc không an toàn ({errDetail}).", EmailFailureType.ConnectionFailed);
            }
            catch (Exception ex)
            {
                var errDetail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                _logger.LogError(ex, "Failed to connect to SMTP host {Host}:{Port}. Detail: {Detail}", smtpHost, port, errDetail);
                return EmailSendResult.Failed($"Không thể kết nối đến máy chủ thư ({smtpHost}:{port}): {errDetail}", EmailFailureType.ConnectionFailed);
            }

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                var cleanPassword = password.Trim().Trim('"', '\'');
                try
                {
                    await client.AuthenticateAsync(username.Trim(), cleanPassword, ct);
                }
                catch (Exception ex)
                {
                    var errDetail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                    _logger.LogError(ex, "Failed to authenticate with SMTP server for user {Username}. Detail: {Detail}", username, errDetail);
                    return EmailSendResult.Failed($"Xác thực tài khoản SMTP thất bại: {errDetail}", EmailFailureType.AuthenticationFailed);
                }
            }

            try
            {
                await client.SendAsync(FormatOptions.Default, message, ct);
                await client.DisconnectAsync(true, ct);
            }
            catch (Exception ex)
            {
                var errDetail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                _logger.LogError(ex, "Failed to send email to {Email}. Detail: {Detail}", toEmail, errDetail);
                return EmailSendResult.Failed($"Lỗi gửi thư tới {toEmail}: {errDetail}", EmailFailureType.SendError);
            }

            _logger.LogInformation("Email sent successfully to {Email} with subject '{Subject}'", toEmail, subject);
            return EmailSendResult.Ok();
        }
        catch (Exception ex)
        {
            var errDetail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            _logger.LogError(ex, "Unexpected failure sending email to {Email}. Detail: {Detail}", toEmail, errDetail);
            return EmailSendResult.Failed($"Lỗi gửi email: {errDetail}", EmailFailureType.SendError);
        }
    }

    /// <summary>
    /// Gửi email đặt lại mật khẩu kèm mã OTP và liên kết đặt lại.
    /// Không ghi OTP hoặc liên kết chứa token bí mật vào log / console.
    /// </summary>
    public async Task<EmailSendResult> SendPasswordResetEmailAsync(string toEmail, string resetToken, string otpCode, CancellationToken ct = default)
    {
        // Ghi log nghiệp vụ KHÔNG chứa OTP hay liên kết chứa mã bí mật
        _logger.LogInformation("Password reset email dispatch requested for {Email}", toEmail);

        var frontendUrl = _cfg["FrontendUrl"]
            ?? _cfg["FRONTEND_URL"]
            ?? _cfg["AppUrl"]
            ?? Environment.GetEnvironmentVariable("FRONTEND_URL")
            ?? "https://libri.id.vn";

        var resetLink = $"{frontendUrl.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(toEmail)}&otp={Uri.EscapeDataString(otpCode)}";

        var htmlBody = LibriEmailTemplates.BuildPasswordResetEmail(toEmail, otpCode, resetLink);

        return await SendEmailAsync(toEmail, "[Libri] Đặt lại mật khẩu Libri", htmlBody, ct);
    }

    /// <summary>
    /// Gửi email xác thực đăng ký tài khoản kèm mã OTP 6 chữ số.
    /// Không ghi OTP vào log / console.
    /// </summary>
    public async Task<EmailSendResult> SendRegistrationOtpEmailAsync(string toEmail, string otpCode, string? fullName = null, CancellationToken ct = default)
    {
        // Ghi log nghiệp vụ KHÔNG chứa OTP
        _logger.LogInformation("Registration verification OTP email dispatch requested for {Email}", toEmail);

        var htmlBody = LibriEmailTemplates.BuildRegistrationOtpEmail(toEmail, otpCode, fullName);

        return await SendEmailAsync(toEmail, "[Libri] Xác thực tài khoản Libri", htmlBody, ct);
    }
}
